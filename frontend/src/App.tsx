import { useCallback, useState, useEffect } from 'react';
import './App.css';
import {
  Button,
  ButtonGroup,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core';

import { Puzzle, PuzzleCell, PuzzleSelection } from './components';

const useStyles = makeStyles((theme: Theme) => createStyles({
  puzzleRoot: {
    backgroundColor: theme.palette.background.default,
    width: 500,
    height: 500,
  },
}));

const INITIAL_PUZZLE_CELLS: PuzzleCell[][] = [
  [],
  [{givenDigit: 5}],
  [{}, {}, {enteredDigit: 2}, {cornerPencilDigits: [1,2,3,4], centrePencilDigits: [1,2,3]}],
  [{enteredDigit: 2, centrePencilDigits: [1,3]}, {centrePencilDigits: [1,2,3]}],
];


type Mode = 'digit' | 'cornerPencil' | 'centrePencil';

interface State {
  cells: PuzzleCell[][];
  selection: PuzzleSelection;
  mode: Mode;
};

export const App = () => {
  const classes = useStyles();

  const [{cells, selection, mode}, setState] = useState<State>({
    cells: INITIAL_PUZZLE_CELLS, selection: [], mode: 'digit'
  });

  useEffect(() => {
    // If the selection is exactly one cell, move it by the given number of rows and columns.
    const moveSelection = (dr: number, dc: number) => setState(({ selection, ...rest }) => {
      if(!selection || selection.length !== 1) { return { selection, ...rest }; }
      const { row, column } = selection[0];
      return { selection: [{ row: (9+row+dr) % 9, column: (9+column+dc) % 9 }], ...rest };
    });

    // Update the cell(s) at the current selection.
    const setCell = (cellOrFunc: PuzzleCell | ((prev: PuzzleCell, prevState: State) => PuzzleCell)) => (
      setState(state => {
        let { cells } = state;
        const { selection } = state;
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
        return { ...state, cells };
      })
    );

    const keyboardEventHandlerFunc = (event: KeyboardEvent) => {
      const digit = '0123456789'.indexOf(event.key);
      if(digit >= 1 && digit <= 9) {
        setCell((cell, { mode }) => {
          // Don't modify givens.
          if(cell.givenDigit) { return cell; }

          switch(mode) {
            case 'digit':
              return { enteredDigit: digit };
            case 'centrePencil':
              return {
                ...cell,
                centrePencilDigits: [
                  ...(cell.centrePencilDigits || []).filter(d => d !== digit),
                  digit,
                ].sort(),
              };
            case 'cornerPencil':
              return {
                ...cell,
                cornerPencilDigits: [
                  ...(cell.cornerPencilDigits || []).filter(d => d !== digit),
                  digit,
                ].sort(),
              };
          }

          // Catch unhandled modes.
          return cell;
        });
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
        case ' ':
          setState(({ mode, ...rest }) => {
            if(mode === 'digit') {
              mode = 'centrePencil';
            } else if(mode === 'centrePencil') {
              mode = 'cornerPencil';
            } else if(mode === 'cornerPencil') {
              mode = 'digit';
            }
            return { mode, ...rest };
          });
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
        <div>
          <ButtonGroup color="primary">
            <Button
              variant={mode === 'digit' ? 'contained' : 'outlined'}
              onClick={() => setState(prev => ({...prev, mode: 'digit'}))}
            >
              Digit
            </Button>
            <Button
              variant={mode === 'centrePencil' ? 'contained' : 'outlined'}
              onClick={() => setState(prev => ({...prev, mode: 'centrePencil'}))}
            >
              Centre
            </Button>
            <Button
              variant={mode === 'cornerPencil' ? 'contained' : 'outlined'}
              onClick={() => setState(prev => ({...prev, mode: 'cornerPencil'}))}
            >
              Corner
            </Button>
          </ButtonGroup>
        </div>
        <div>
          <Puzzle
            classes={{root: classes.puzzleRoot}}
            selection={selection} cells={cells}
            onCellClick={({row, column, ctrlKey}) => selectCell(row, column, ctrlKey)}
            onCellDragStart={({row, column, ctrlKey}) => selectCell(row, column, ctrlKey)}
            onCellDrag={({row, column }) => selectCell(row, column, true)}
            onBlur={() => setState(state => ({...state, selection: []}))}
          />
        </div>
      </header>
    </div>
  );
};

export default App;
