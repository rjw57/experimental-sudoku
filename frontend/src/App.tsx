import React from 'react';
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

const puzzleState: PuzzleState = {
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
  selection: [
    {row: 2, column: 8 },
    {row: 3, column: 1 },
    {row: 2, column: 2 },
    {row: 4, column: 8 },
    {row: 6, column: 7 },
    {row: 7, column: 6 },
    {row: 8, column: 2 },
    {row: 2, column: 6 },
    {row: 1, column: 0 },
    {row: 2, column: 4 },
    {row: 3, column: 4 },
  ],
};

export const App = () => {
  const classes = useStyles();

  return (
    <div className="App">
      <header className="App-header">
        <Puzzle classes={{root: classes.puzzleRoot}} puzzleState={puzzleState} />
      </header>
    </div>
  );
};

export default App;
