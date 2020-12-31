import { useState, useCallback } from 'react';
import { PuzzleCell, PuzzleSelection } from './components/Puzzle';

export interface PuzzleControllerState {
  cellsHistory: PuzzleCell[][][];
  selection: PuzzleSelection;
};

export interface PuzzleControllerUndoAction {
  type: 'undo';
};

export interface PuzzleControllerEnterDigitAction {
  type: 'enterDigit';
  payload: { digit: number };
};

export interface PuzzleControllerTogglePencilMarkAction {
  type: 'togglePencilMark';
  payload: { type: 'corner' | 'centre', digit: number };
};

export interface PuzzleControllerMoveSelectionAction {
  type: 'moveSelection';
  payload: { rowDelta: number, columnDelta: number };
};

export interface PuzzleControllerUpdateSelectionAction {
  type: 'updateSelection';
  payload: { selection: PuzzleSelection, extend?: boolean };
};

export type PuzzleControllerAction = (
  PuzzleControllerUndoAction | PuzzleControllerEnterDigitAction |
  PuzzleControllerTogglePencilMarkAction | PuzzleControllerMoveSelectionAction |
  PuzzleControllerUpdateSelectionAction
);

export type PuzzleControllerDispatchFunction = (action: PuzzleControllerAction) => void;

export const usePuzzleController =
  (initialCells: PuzzleCell[][] = []): [PuzzleControllerState, PuzzleControllerDispatchFunction] => {
    const [state, setState] = useState<PuzzleControllerState>({
      cellsHistory: [initialCells], selection: [],
    });

    const dispatch = useCallback((action: PuzzleControllerAction) => {
      // If the selection is exactly one cell, move it by the given number of rows and columns.
      const moveSelection = (dr: number, dc: number) => setState(({ selection, ...rest }) => {
        if(!selection || selection.length !== 1) { return { selection, ...rest }; }
        const { row, column } = selection[0];
        return { selection: [{ row: (9+row+dr) % 9, column: (9+column+dc) % 9 }], ...rest };
      });

      // Update the cell(s) at the current selection.
      const setCell = (cellOrFunc: PuzzleCell | ((prev: PuzzleCell, prevState: PuzzleControllerState) => PuzzleCell)) => (
        setState(state => {
          const { cellsHistory, selection } = state;
          let cells = cellsHistory[cellsHistory.length - 1];
          selection.forEach(({ row, column }) => {
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
        case 'moveSelection':
          moveSelection(action.payload.rowDelta, action.payload.columnDelta);
          break;
        case 'undo':
          setState(state => {
            const { cellsHistory } = state;
            if(cellsHistory.length < 2) { return state; }
            return { ...state, cellsHistory: cellsHistory.slice(0, -1) };
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

    return [state, dispatch];
  };

export default usePuzzleController;
