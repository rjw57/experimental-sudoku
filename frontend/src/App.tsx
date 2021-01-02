import { useState, useEffect, useMemo, useCallback, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useMeasure } from 'react-use';
import './App.css';
import {
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
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

const INITIAL_PUZZLE_CELLS: PuzzleCell[][] = [];

type Mode = 'digit' | 'cornerPencil' | 'centrePencil' | 'given';

interface State {
  mode: Mode;
};

const checkSudoku = (cells: PuzzleCell[][]) => {
  // Solved sudokus must be 9x9
  if(cells.length !== 9 || !cells.every(r => r.length === 9)) {
    return false;
  }

  // Each row, column and box must have the digits 1 to 9
  for(let i=0; i<9; i++) {
    const row = cells[i].map(c => c.enteredDigit || c.givenDigit);
    const col = cells.map(r => r[i].enteredDigit || r[i].givenDigit);
    const box = [];
    for(let r=0; r<3; r++) {
      for(let c=0; c<3; c++) {
        const cell = cells[r+(i-(i%3))][c+3*(i%3)];
        box.push(cell.enteredDigit || cell.givenDigit);
      }
    }
    for(let d=1; d<=9; d++) {
      if(row.indexOf(d) === -1) { return false; }
      if(col.indexOf(d) === -1) { return false; }
      if(box.indexOf(d) === -1) { return false; }
    }
  }

  return true;
};

export const App = () => {
  const classes = useStyles();
  const [
    {cellsHistory, selection, cursorRow, cursorColumn}, dispatch
  ] = usePuzzleController(INITIAL_PUZZLE_CELLS);
  const [{mode}, setState] = useState<State>({ mode: 'digit' });
  const cells = cellsHistory[cellsHistory.length-1];
  const solved = useMemo(() => checkSudoku(cells), [cells]);
  const [puzzleDivRef, { width, height }] = useMeasure<HTMLDivElement>();
  const cellSize = Math.min(width, height) / 9;

  const handlePuzzleOnKeyDown = useCallback((event: ReactKeyboardEvent) => {
    const digit = '0123456789'.indexOf(event.key);
    if(digit >= 1 && digit <= 9) {
      setState(state => {
        const { mode } = state;
        switch(mode) {
          case 'digit':
            dispatch({ type: 'enterDigit', payload: { digit } });
            break;
          case 'given':
            dispatch({ type: 'enterGiven', payload: { digit } });
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
            row: -1, column: 0, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'ArrowDown':
        dispatch({
          type: 'setCursor', payload: {
            row: 1, column: 0, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'ArrowLeft':
        dispatch({
          type: 'setCursor', payload: {
            row: 0, column: -1, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'ArrowRight':
        dispatch({
          type: 'setCursor', payload: {
            row: 0, column: 1, relative: true, extendSelection: event.shiftKey,
            preserveSelection: event.ctrlKey
          }
        });
        break;
      case 'Escape':
        dispatch({ type: 'updateSelection', payload: { selection: [] } });
        break;
      case 'Backspace':
        dispatch({
          type: 'clearCell',
          payload: {
            retainEntered: mode !== 'digit',
            retainCornerPencils: mode !== 'cornerPencil',
            retainCentrePencils: mode !== 'centrePencil',
            retainGivens: mode !== 'given',
          }
        });
        break;
    }
  }, [dispatch, mode]);

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
              mode = 'given';
            } else if(mode === 'given') {
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
            <Button
              variant={mode === 'given' ? 'contained' : 'outlined'}
              onClick={() => setState(prev => ({...prev, mode: 'given'}))}
              tabIndex={5}
            >
              Given
            </Button>
          </ButtonGroup>
        </div>
        <div ref={puzzleDivRef}>
          <Puzzle
            classes={{root: classes.puzzleRoot}}
            tabIndex={5} cellSize={cellSize}
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
        <div>
          <FormControlLabel control={<Checkbox checked={solved} />} label="Solved" />
        </div>
      </header>
    </div>
  );
};

export default App;
