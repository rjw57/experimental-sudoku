import { useState, useMemo, useCallback, KeyboardEvent } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { useMeasure } from 'react-use';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';
import {
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core';

import { Puzzle } from '../components';
import {
  usePuzzleController,
  useSelectionBehaviour,
  useEditBehaviour,
  EditMode,
} from '../hooks';
import checkSudoku from '../checkSudoku';

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    minHeight: '100vh',
    minWidth: '100vw',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  puzzleRoot: {
    backgroundColor: theme.palette.background.default,
    width: 500,
    height: 500,
  },
}));

export interface SolvePageProps {
  puzzleId: string;
};

export const SolvePage = ({ puzzleId }: SolvePageProps) => {
  const [ user ] = useAuthState(firebase.auth());
  const [ puzzleDocument ] = useDocument(
    firebase.firestore().collection('puzzles').doc(puzzleId)
  );

  const classes = useStyles();
  const [
    { cellsHistory, selection, cursorRow, cursorColumn }, dispatch
  ] = usePuzzleController();
  const {
    handleKeyDown: handleSelectionKeyDown, handleCellClick, handleCellDragStart, handleCellDrag
  } = useSelectionBehaviour(dispatch);
  const [mode, setMode] = useState<EditMode>('digit');
  const { handleKeyDown: handleEditKeyDown } = useEditBehaviour(mode, dispatch);

  const cells = cellsHistory[cellsHistory.length-1];
  const isSolved = useMemo(() => checkSudoku(cells), [cells]);

  const [puzzleDivRef, { width, height }] = useMeasure<HTMLDivElement>();
  const cellSize = Math.min(width, height) / 9;

  const handlePuzzleOnKeyDown = useCallback((event: KeyboardEvent) => {
    handleEditKeyDown(event);
    handleSelectionKeyDown(event);

    switch(event.key) {
      case ' ':
        event.preventDefault();
        setMode(mode => {
          if(mode === 'digit') {
            mode = 'centrePencil';
          } else if(mode === 'centrePencil') {
            mode = 'cornerPencil';
          } else if(mode === 'cornerPencil') {
            mode = 'given';
          } else if(mode === 'given') {
            mode = 'digit';
          }
          return mode;
        });
        break;
    }
  }, [setMode, handleSelectionKeyDown, handleEditKeyDown]);

  return (
    <div className={classes.root}>
      <div>
        <ButtonGroup color="primary">
          <Button
            variant={mode === 'digit' ? 'contained' : 'outlined'}
            onClick={() => setMode('digit')}
            tabIndex={2}
          >
            Digit
          </Button>
          <Button
            variant={mode === 'centrePencil' ? 'contained' : 'outlined'}
            onClick={() => setMode('centrePencil')}
            tabIndex={3}
          >
            Centre
          </Button>
          <Button
            variant={mode === 'cornerPencil' ? 'contained' : 'outlined'}
            onClick={() => setMode('cornerPencil')}
            tabIndex={4}
          >
            Corner
          </Button>
          <Button
            variant={mode === 'given' ? 'contained' : 'outlined'}
            onClick={() => setMode('given')}
            tabIndex={5}
          >
            Given
          </Button>
        </ButtonGroup>
      </div>
      <div ref={puzzleDivRef}>
        <Puzzle
          classes={{root: classes.puzzleRoot}}
          tabIndex={6} cellSize={cellSize}
          selection={selection} cells={cells} cursorRow={cursorRow} cursorColumn={cursorColumn}
          onKeyDown={handlePuzzleOnKeyDown}
          onCellClick={handleCellClick}
          onCellDragStart={handleCellDragStart}
          onCellDrag={handleCellDrag}
        />
      </div>
      <div>
        <FormControlLabel control={<Checkbox checked={isSolved} />} label="Solved" />
      </div>
      { user && <div>Signed in as { user.displayName || user.email || user.uid }</div> }
      { puzzleDocument && <div>Puzzle: { puzzleDocument.data().title }</div> }
    </div>
  );
};

export default SolvePage;
