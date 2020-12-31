import { useCallback, useState, useEffect } from 'react';
import './App.css';
import {
  Button,
  ButtonGroup,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core';

import { Puzzle, PuzzleCell } from './components';
import usePuzzleController from './usePuzzleController';

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
];


type Mode = 'digit' | 'cornerPencil' | 'centrePencil';

interface State {
  mode: Mode;
};

export const App = () => {
  const classes = useStyles();
  const [{cellsHistory, selection}, dispatch] = usePuzzleController(INITIAL_PUZZLE_CELLS);
  const [{mode}, setState] = useState<State>({ mode: 'digit' });
  const cells = cellsHistory[cellsHistory.length-1];

  useEffect(() => {
    const keyboardEventHandlerFunc = (event: KeyboardEvent) => {
      const digit = '0123456789'.indexOf(event.key);
      if(digit >= 1 && digit <= 9) {
        setState(state => {
          const { mode } = state;
          switch(mode) {
            case 'digit':
              dispatch({ type: 'enterDigit', payload: { digit } });
              break;
            case 'centrePencil':
              dispatch({ type: 'togglePencilMark', payload: { type: 'centre', digit } });
              break;
            case 'cornerPencil':
              dispatch({ type: 'togglePencilMark', payload: { type: 'corner', digit } });
              break;
          }
          return state;
        });
      }

      switch(event.key) {
        case 'ArrowUp':
          dispatch({ type: 'moveSelection', payload: { rowDelta: -1, columnDelta: 0 } });
          break;
        case 'ArrowDown':
          dispatch({ type: 'moveSelection', payload: { rowDelta: 1, columnDelta: 0 } });
          break;
        case 'ArrowLeft':
          dispatch({ type: 'moveSelection', payload: { rowDelta: 0, columnDelta: -1 } });
          break;
        case 'ArrowRight':
          dispatch({ type: 'moveSelection', payload: { rowDelta: 0, columnDelta: 1 } });
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
        case 'z':
          event.ctrlKey && dispatch({ type: 'undo' });
          break;
      }
    };

    document.addEventListener('keydown', keyboardEventHandlerFunc);
    return () => {
      document.removeEventListener('keydown', keyboardEventHandlerFunc);
    }
  }, [setState, dispatch]);

  const selectCell = useCallback((row: number, column: number, extend = false) => (
    dispatch({ type: 'updateSelection', payload: { selection: [{row, column}], extend } })
  ), [dispatch]);

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
