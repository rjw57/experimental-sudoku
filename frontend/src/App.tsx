import { useCallback, useState, useEffect } from 'react';
import './App.css';
import { makeStyles, createStyles, Theme } from '@material-ui/core';

import { Puzzle, PuzzleCell, PuzzleSelection, PuzzleGivenState } from './components';

const useStyles = makeStyles((theme: Theme) => createStyles({
  puzzleRoot: {
    backgroundColor: theme.palette.background.default,
    width: 500,
    height: 500,
  },
}));

const PUZZLE_GIVEN_STATE: PuzzleGivenState = {
  givenDigits: [
    {row: 1, column: 2, digit: 7},
    {row: 8, column: 8, digit: 1},
  ],
};

const INITIAL_PUZZLE_CELLS: PuzzleCell[][] = [
  [],
  [],
  [{}, {}, {enteredDigit: 2}, {cornerPencilDigits: [1,2,3,4], centrePencilDigits: [1,2,3]}],
  [{enteredDigit: 2, centrePencilDigits: [1,3]}, {centrePencilDigits: [1,2,3]}],
];

interface State {
  cells: PuzzleCell[][];
  selection: PuzzleSelection;
};

export const App = () => {
  const classes = useStyles();

  const [{cells, selection}, setState] = useState<State>({cells: INITIAL_PUZZLE_CELLS, selection: []});

  useEffect(() => {
    // If the selection is exactly one cell, move it by the given number of rows and columns.
    const moveSelection = (dr: number, dc: number) => setState(({ selection, ...rest }) => {
      if(!selection || selection.length !== 1) { return { selection, ...rest }; }
      const { row, column } = selection[0];
      return { selection: [{ row: (9+row+dr) % 9, column: (9+column+dc) % 9 }], ...rest };
    });

    // Update the cell(s) at the current selection.
    const setCell = (cellOrFunc: PuzzleCell | ((prev: PuzzleCell) => PuzzleCell)) => (
      setState(({ cells, selection, ...rest }) => {
        selection.forEach(({ row, column }) => {
          // Make sure the cells array has enough rows.
          while(cells.length <= row) { cells = [...cells, []]; }

          // Make sure the row array has enough cells.
          while(cells[row].length <= column) { cells[row] = [...cells[row], {}]; }

          const newCell = (typeof cellOrFunc === 'function')
            ? cellOrFunc(cells[row][column]) : cellOrFunc

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
        return { cells, selection, ...rest };
      })
    );

    const keyboardEventHandlerFunc = (event: KeyboardEvent) => {
      const digit = '0123456789'.indexOf(event.key);
      if(digit >= 1 && digit <= 9) {
        setCell({ enteredDigit: digit });
      }

      switch(event.key) {
        case 'ArrowUp':
          moveSelection(-1, 0);
          break;
        case 'ArrowDown':
          moveSelection(1, 0);
          break;
        case 'ArrowLeft':
          moveSelection(0, -1);
          break;
        case 'ArrowRight':
          moveSelection(0, 1);
          break;
      }
    };
    document.addEventListener('keydown', keyboardEventHandlerFunc);

    return () => { document.removeEventListener('keydown', keyboardEventHandlerFunc); }
  }, [setState]);

  const selectCell = useCallback(
    (row: number, column: number, extend = false) => {
      if(!extend) {
        setState(({ selection, ...rest }) => ({ selection: [{row, column}], ...rest }));
      } else {
        setState(({ selection, ...rest }) => ({
          selection: [
            {row, column}, ...selection.filter(s => s.row !== row || s.column !== column)
          ],
          ...rest
        }))
      }
    }, [setState]
  );

  return (
    <div className="App">
      <header className="App-header">
        <Puzzle
          classes={{root: classes.puzzleRoot}}
          selection={selection} givenState={PUZZLE_GIVEN_STATE} cells={cells}
          onCellClick={({row, column, ctrlKey}) => selectCell(row, column, ctrlKey)}
          onCellDragStart={({row, column, ctrlKey}) => selectCell(row, column, ctrlKey)}
          onCellDrag={({row, column }) => selectCell(row, column, true)}
          onBlur={() => setState(state => ({...state, selection: []}))}
        />
      </header>
    </div>
  );
};

export default App;
