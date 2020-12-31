import { useState, useEffect, useCallback, KeyboardEvent as ReactKeyboardEvent } from 'react';
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
  const [
    {cellsHistory, selection, cursorRow, cursorColumn}, dispatch
  ] = usePuzzleController(INITIAL_PUZZLE_CELLS);
  const [{mode}, setState] = useState<State>({ mode: 'digit' });
  const cells = cellsHistory[cellsHistory.length-1];

  const handlePuzzleOnKeyDown = useCallback((event: ReactKeyboardEvent) => {
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
        dispatch({
          type: 'setCursor', payload: {
            row: -1, column: 0, relative: true, extendSelection: event.shiftKey, preserveSelection: true
          }
        });
        break;
      case 'ArrowDown':
        dispatch({
          type: 'setCursor', payload: {
            row: 1, column: 0, relative: true, extendSelection: event.shiftKey,
            preserveSelection: true
          }
        });
        break;
      case 'ArrowLeft':
        dispatch({
          type: 'setCursor', payload: {
            row: 0, column: -1, relative: true, extendSelection: event.shiftKey,
            preserveSelection: true
          }
        });
        break;
      case 'ArrowRight':
        dispatch({
          type: 'setCursor', payload: {
            row: 0, column: 1, relative: true, extendSelection: event.shiftKey,
            preserveSelection: true
          }
        });
        break;
      case 'Escape':
        dispatch({ type: 'updateSelection', payload: { selection: [] } });
        break;
    }
  }, [dispatch]);

  useEffect(() => {
    const globalKeyDownHandler = (event: KeyboardEvent) => {
      switch(event.key) {
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

    document.addEventListener('keydown', globalKeyDownHandler);
    return () => {
      document.removeEventListener('keydown', globalKeyDownHandler);
    }
  }, [setState, dispatch]);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <ButtonGroup color="primary">
            <Button
              variant={mode === 'digit' ? 'contained' : 'outlined'}
              onClick={() => setState(prev => ({...prev, mode: 'digit'}))}
              tabIndex={2}
            >
              Digit
            </Button>
            <Button
              variant={mode === 'centrePencil' ? 'contained' : 'outlined'}
              onClick={() => setState(prev => ({...prev, mode: 'centrePencil'}))}
              tabIndex={3}
            >
              Centre
            </Button>
            <Button
              variant={mode === 'cornerPencil' ? 'contained' : 'outlined'}
              onClick={() => setState(prev => ({...prev, mode: 'cornerPencil'}))}
              tabIndex={4}
            >
              Corner
            </Button>
          </ButtonGroup>
        </div>
        <div>
          <Puzzle
            classes={{root: classes.puzzleRoot}}
            tabIndex={5}
            selection={selection} cells={cells} cursorRow={cursorRow} cursorColumn={cursorColumn}
            onKeyDown={handlePuzzleOnKeyDown}
            onCellClick={({row, column, ctrlKey}) => dispatch({
              type: 'setCursor', payload: { row, column, extendSelection: ctrlKey }
            })}
            onCellDragStart={({row, column, ctrlKey}) => dispatch({
              type: 'setCursor', payload: { row, column, extendSelection: ctrlKey }
            })}
            onCellDrag={({row, column }) => dispatch({
              type: 'setCursor', payload: { row, column, extendSelection: true }
            })}
          />
        </div>
      </header>
    </div>
  );
};

export default App;
