import { useState, useCallback } from 'react';
import { PuzzleCell, PuzzleSelection } from '../components';

export interface PuzzleControllerState {
  cursorRow: number;
  cursorColumn: number;
  cellsHistory: PuzzleCell[][][];
  selection: PuzzleSelection;
};

export interface PuzzleControllerUndoAction {
  type: 'undo';
};

export interface PuzzleControllerEnterAction {
  type: 'enterDigit' | 'enterGiven';
  payload: { digit: number };
};

export interface PuzzleControllerTogglePencilMarkAction {
  type: 'togglePencilMark';
  payload: { type: 'corner' | 'centre', digit: number };
};

export interface PuzzleControllerClearCellAction {
  type: 'clearCell';
  payload: {
    retainEntered?: boolean,
    retainCornerPencils?: boolean,
    retainCentrePencils?: boolean,
    retainGivens?: boolean,
  }
}

export interface PuzzleControllerSetCursorAction {
  type: 'setCursor';
  payload: {
    row: number,
    column: number,
    extendSelection?: boolean,
    relative?: boolean,
    preserveSelection?: boolean,
  };
};

export interface PuzzleControllerUpdateSelectionAction {
  type: 'updateSelection';
  payload: { selection: PuzzleSelection, extend?: boolean };
};

export type PuzzleControllerAction = (
  PuzzleControllerUndoAction |
  PuzzleControllerEnterAction |
  PuzzleControllerTogglePencilMarkAction |
  PuzzleControllerUpdateSelectionAction |
  PuzzleControllerSetCursorAction |
  PuzzleControllerClearCellAction
);

export type PuzzleControllerDispatchFunction = (action: PuzzleControllerAction) => void;

export const usePuzzleController =
  (initialCells: PuzzleCell[][] = []): [PuzzleControllerState, PuzzleControllerDispatchFunction] => {
    const [state, setState] = useState<PuzzleControllerState>({
      cellsHistory: [initialCells], selection: [], cursorRow: 0, cursorColumn: 0,
    });

    const dispatch = useCallback((action: PuzzleControllerAction) => {
      // Update the cell(s) at the current selection.
      const setCell = (cellOrFunc: PuzzleCell | ((prev: PuzzleCell, prevState: PuzzleControllerState) => PuzzleCell)) => (
        setState(state => {
          const { cellsHistory, selection, cursorRow, cursorColumn } = state;
          const editTarget = [
            ...selection.filter(d => d.row !== cursorRow || d.column !== cursorColumn),
            { row: cursorRow, column: cursorColumn }
          ];
          let cells = cellsHistory[cellsHistory.length - 1];
          editTarget.forEach(({ row, column }) => {
            // Make sure the cells array has enough rows.
            while(cells.length <= row) { cells = [...cells, []]; }

            // Make sure the row array has enough cells.
            while(cells[row].length <= column) { cells[row] = [...cells[row], {}]; }

            const newCell = (typeof cellOrFunc === 'function')
              ? cellOrFunc(cells[row][column], state) : cellOrFunc

            cells = [
              ...cells.slice(0, row),
              [
                ...cells[row].slice(0, column),
                newCell,
                ...cells[row].slice(column+1),
              ],
              ...cells.slice(row+1),
            ];
          });
          return { ...state, cellsHistory: [...cellsHistory, cells] };
        })
      );

      switch(action.type) {
        case 'updateSelection':
          setState(({selection: priorSelection, ...rest}) => {
            const { selection, extend = false } = action.payload;
            if(extend) {
              selection.forEach(({ row, column }) => {
                priorSelection = priorSelection.filter(s => s.row !== row || s.column !== column);
              });
              return { ...rest, selection: [...priorSelection, ...selection] };
            } else {
              return { ...rest, selection };
            }
          });
          break;
        case 'setCursor':
          setState(state => {
            const {
              row, column, extendSelection = false, relative = false, preserveSelection = false
            } = action.payload;
            const { cursorRow, cursorColumn, selection } = state;
            const newRow = relative ? (9 + cursorRow + row) % 9 : row;
            const newColumn = relative ? (9 + cursorColumn + column) % 9 : column;
            const newSelection = extendSelection ? [
              ...selection.filter(s => s.row !== cursorRow || s.column !== cursorColumn),
              { row: cursorRow, column: cursorColumn },
            ] : (preserveSelection ? selection : []);
            return {
              ...state, cursorRow: newRow, cursorColumn: newColumn, selection: newSelection
            };
          });
          break;
        case 'undo':
          setState(state => {
            const { cellsHistory } = state;
            if(cellsHistory.length < 2) { return state; }
            return { ...state, cellsHistory: cellsHistory.slice(0, -1) };
          });
          break;
        case 'clearCell':
          setCell(cell => {
            const {
              retainEntered = false, retainCornerPencils = false, retainCentrePencils = false,
              retainGivens = false,
            } = action.payload;
            const newCell: typeof cell = {};
            if(retainEntered) { newCell.enteredDigit = cell.enteredDigit; }
            if(retainCornerPencils) { newCell.cornerPencilDigits = cell.cornerPencilDigits; }
            if(retainCentrePencils) { newCell.centrePencilDigits = cell.centrePencilDigits; }
            if(retainGivens) { newCell.givenDigit = cell.givenDigit; }
            return newCell;
          });
          break;
        case 'enterDigit':
          // Entering a digit replaces any existing cell content if it is not a given.
          setCell(cell => {
            const { digit } = action.payload;
            if(typeof cell.givenDigit !== 'undefined') { return cell; }
            return { enteredDigit: digit };
          });
          break;
        case 'enterGiven':
          // Entering a given replaces the entire cell.
          setCell(cell => {
            const { digit } = action.payload;
            return { givenDigit: digit };
          });
          break;
        case 'togglePencilMark':
          setCell(cell => {
            const { type, digit } = action.payload;

            // Don't modify givens or entered digits.
            if(typeof cell.givenDigit !== 'undefined') { return cell; }
            if(typeof cell.enteredDigit !== 'undefined') { return cell; }

            const toggleDigit = (digits: number[], digit: number) => {
              const index = digits.indexOf(digit);
              if(index === -1) {
                return [...digits, digit].sort();
              }
              return digits.filter(d => d !== digit);
            }

            switch(type) {
              case 'corner':
                return {
                  ...cell, cornerPencilDigits: toggleDigit(cell.cornerPencilDigits || [], digit)
                };
              case 'centre':
                return {
                  ...cell, centrePencilDigits: toggleDigit(cell.centrePencilDigits || [], digit)
                };
            }

            return cell;
          });
      }
    }, [setState]);

    return [{
      ...state,
      // The cursor is always part of the visible selection.
      selection: [...state.selection, {row: state.cursorRow, column: state.cursorColumn}]
    }, dispatch];
  };

export default usePuzzleController;
