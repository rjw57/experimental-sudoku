import { useCallback, useState, useEffect } from 'react';
import './App.css';
import { makeStyles, createStyles, Theme } from '@material-ui/core';

import { Puzzle, PuzzleState } from './components';

const useStyles = makeStyles((theme: Theme) => createStyles({
  puzzleRoot: {
    backgroundColor: theme.palette.background.default,
    width: 500,
    height: 500,
  },
}));

const INITIAL_PUZZLE_STATE: PuzzleState = {
  givenDigits: [
    {row: 1, column: 2, digit: 7},
  ],
  enteredDigits: [
    {row: 2, column: 8, digit: 1},
    {row: 3, column: 1, digit: 2},
    {row: 2, column: 2, digit: 3},
    {row: 4, column: 8, digit: 4},
    {row: 6, column: 7, digit: 5},
    {row: 7, column: 6, digit: 6},
    {row: 8, column: 2, digit: 7},
    {row: 2, column: 6, digit: 8},
    {row: 1, column: 0, digit: 9},
  ],
  centrePencils: [
    {row: 2, column: 4, digits: [1, 2, 3, 4, 5, 6]},
    {row: 3, column: 4, digits: [1, 2, 3]},
  ],
  cornerPencils: [
    {row: 0, column: 8, digits: [1, 2, 3, 4, 5, 6]},
    {row: 3, column: 7, digits: [1, 2, 3]},
  ],
};

export const App = () => {
  const classes = useStyles();

  const [puzzleState, setPuzzleState] = useState<PuzzleState>(INITIAL_PUZZLE_STATE);
  const { selection = [] } = puzzleState;

  const setSelection = useCallback(
    (valOrFunc: PuzzleState["selection"] | ((prev: PuzzleState["selection"]) => PuzzleState["selection"])) => {
      if(typeof valOrFunc === 'function') {
        return setPuzzleState(prev => ({...prev, selection: valOrFunc(prev.selection)}));
      } else {
        return setPuzzleState(prev => ({...prev, selection: valOrFunc}));
      }
    }, [setPuzzleState]
  );

  const setDigit = useCallback((digit: number) => setPuzzleState(puzzleState => {
    let newEnteredDigits = [...(puzzleState.enteredDigits || [])];
    (puzzleState.selection || []).forEach(({ row, column }) => {
      newEnteredDigits = newEnteredDigits.filter(elem => elem.row !== row || elem.column !== column);
      newEnteredDigits.push({ row, column, digit });
    });
    return {...puzzleState, enteredDigits: newEnteredDigits};
  }), [setPuzzleState]);

  useEffect(() => {
    const moveSelection = (dr: number, dc: number) => setSelection(prev => {
      if(!prev || prev.length !== 1) { return; }
      const { row, column } = prev[0];
      return [{ row: (9+row+dr) % 9, column: (9+column+dc) % 9 }];
    });

    const handlerFunc = (event: KeyboardEvent) => {
      const digit = '0123456789'.indexOf(event.key);
      if(digit >= 1 && digit <= 9) {
        setDigit(digit);
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

    document.addEventListener('keydown', handlerFunc);
    return () => { document.removeEventListener('keydown', handlerFunc); }
  }, [setSelection, setDigit, setPuzzleState]);

  const selectCell = useCallback(
    (row: number, column: number, extend = false) => {
      if(!extend) {
        setSelection([{row, column}]);
      } else {
        setSelection(prev => ([
          {row, column},
          ...(prev ? prev.filter(s => s.row !== row || s.column !== column) : [])
        ]));
      }
    }, [setSelection]
  );

  return (
    <div className="App">
      <header className="App-header">
        <Puzzle
          classes={{root: classes.puzzleRoot}} puzzleState={{...puzzleState, selection}}
          onCellClick={({row, column, ctrlKey}) => selectCell(row, column, ctrlKey)}
          onCellDragStart={({row, column, ctrlKey}) => selectCell(row, column, ctrlKey)}
          onCellDrag={({row, column }) => selectCell(row, column, true)}
          onBlur={() => setSelection([])}
        />
      </header>
    </div>
  );
};

export default App;
