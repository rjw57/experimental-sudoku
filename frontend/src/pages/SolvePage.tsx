import { useEffect, useState, useMemo, useCallback, KeyboardEvent } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
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
import { updatePuzzle, puzzlesCollection } from '../db';
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
  const classes = useStyles();
  const [ user ] = useAuthState(firebase.auth());
  const [ puzzleDocument ] = useDocument(puzzlesCollection().doc(puzzleId));

  const canEdit = (
    user && user.uid && puzzleDocument && (puzzleDocument.data().ownerUid === user.uid)
  );
  const [isEditing, setIsEditing] = useState(false);

  const [
    { cellsHistory, selection, cursorRow, cursorColumn }, dispatch
  ] = usePuzzleController();
  const {
    handleKeyDown: handleSelectionKeyDown, handleCellClick, handleCellDragStart, handleCellDrag
  } = useSelectionBehaviour(dispatch);
  const [mode, setMode] = useState<EditMode>('digit');
  const { handleKeyDown: handleEditKeyDown } = useEditBehaviour(isEditing ? 'given' : mode, dispatch);

  const cells = cellsHistory[cellsHistory.length-1];
  const isSolved = useMemo(() => checkSudoku(cells), [cells]);

  const [puzzleDivRef, { width, height }] = useMeasure<HTMLDivElement>();
  const cellSize = Math.min(width, height) / 9;

  useEffect(() => {
    if(!isEditing || !puzzleDocument) { return; }
    const newCells: { row: number; column: number; givenDigit: number }[] = [];
    cells.forEach((rowElems, row) => rowElems.forEach(({ givenDigit }, column) => {
      if(givenDigit) {
        newCells.push({ row, column, givenDigit });
      }
    }));
    puzzlesCollection().doc(puzzleId).set(updatePuzzle(
      puzzleDocument.data(), { cells: newCells }
    ));
  }, [isEditing, cells, puzzleDocument, puzzleId]);

  useEffect(() => {
    if(!puzzleDocument) { return; }
    const { cells } = puzzleDocument.data();
    if(!cells) { return; }
    dispatch({
      type: 'setCells',
      payload: {
        cells: (puzzleDocument.data().cells || []).map((data: {[key: string]: any}) => ({
          row: Number(data.row),
          column: Number(data.column),
          cell: { givenDigit: Number(data.givenDigit) }
        }))
      }
    });
  }, [puzzleDocument, dispatch]);

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
            mode = 'digit';
          }
          return mode;
        });
        break;
    }
  }, [setMode, handleSelectionKeyDown, handleEditKeyDown]);

  return (
    <div className={classes.root}>
      {
        canEdit && (
          <FormControlLabel
            onChange={event => setIsEditing((event.target as HTMLInputElement).checked)}
            control={<Checkbox checked={isEditing}/>} label="Edit"
          />
        )
      }
      {
        !isEditing && <div>
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
          </ButtonGroup>
        </div>
      }
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
