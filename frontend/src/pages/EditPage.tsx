import { useEffect, useState, useCallback, KeyboardEvent } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useMeasure } from 'react-use';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocument } from 'react-firebase-hooks/firestore';
import {
  Button,
  TextField,
  Theme,
  createStyles,
  makeStyles,
} from '@material-ui/core';

import { Puzzle } from '../components';
import { updatePuzzle, puzzlesCollection, PuzzleDocument } from '../db';
import {
  usePuzzleController,
  useSelectionBehaviour,
  useEditBehaviour,
} from '../hooks';

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

export interface EditPageProps {
  puzzleId: string;
};

export const EditPage = ({ puzzleId }: EditPageProps) => {
  const classes = useStyles();
  const [ user ] = useAuthState(firebase.auth());
  const [ puzzleDocument ] = useDocument(puzzlesCollection().doc(puzzleId));

  const canEdit = (
    user && user.uid && puzzleDocument && (puzzleDocument.data().ownerUid === user.uid)
  );
  const [
    { cellsHistory, selection, cursorRow, cursorColumn }, dispatch
  ] = usePuzzleController();
  const {
    handleKeyDown: handleSelectionKeyDown, handleCellClick, handleCellDragStart, handleCellDrag
  } = useSelectionBehaviour(dispatch);
  const [title, setTitle] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const { handleKeyDown: handleEditKeyDown } = useEditBehaviour('given', dispatch);

  const cells = cellsHistory[cellsHistory.length-1];

  useEffect(() => {
    if(!puzzleDocument) { return; }
    const { title, cells, updatedAt } = puzzleDocument.data() as PuzzleDocument;
    if(!updatedAt) { return; }
    const updatedAtDate = (updatedAt as firebase.firestore.Timestamp).toDate();
    if(lastUpdatedAt && updatedAtDate <= lastUpdatedAt) { return; }
    setLastUpdatedAt(updatedAtDate);
    setTitle(title);
    dispatch({ type: 'setCells', payload: {
      cells: cells.map(({ row, column, givenDigit }) => ({ row, column, cell: { givenDigit }})),
      clearExisting: true
    } });
  }, [puzzleDocument, setTitle, lastUpdatedAt, setLastUpdatedAt, dispatch]);

  const [puzzleDivRef, { width, height }] = useMeasure<HTMLDivElement>();
  const cellSize = Math.min(width, height) / 9;

  const handlePuzzleOnKeyDown = useCallback((event: KeyboardEvent) => {
    handleEditKeyDown(event);
    handleSelectionKeyDown(event);
  }, [handleSelectionKeyDown, handleEditKeyDown]);

  const handleSave = () => {
    if(!puzzleDocument) { return; }
    const newCells: { row: number; column: number; givenDigit: number}[] = [];
    cells.forEach((rowElems, row) => rowElems.forEach(({ givenDigit }, column) => {
      if(givenDigit !== undefined) {
        newCells.push({ row, column, givenDigit });
      }
    }));
    puzzlesCollection().doc(puzzleId).set(updatePuzzle(puzzleDocument.data(), {
      title, cells: newCells,
    }));
  };

  if(!canEdit) { return null; }

  return (
    <div className={classes.root}>
      {
        <TextField
          label="Title" variant="outlined" value={title}
          onChange={event => setTitle(event.target.value)}
        />
      }
      <Button
        variant="outlined" color="primary" onClick={handleSave}
        disabled={title.length <= 3}
      >Save</Button>
      <div ref={puzzleDivRef}>
        <Puzzle
          classes={{root: classes.puzzleRoot}}
          tabIndex={6} cellSize={cellSize}
          selection={selection} cells={cells}
          cursorRow={cursorRow} cursorColumn={cursorColumn}
          onKeyDown={handlePuzzleOnKeyDown}
          onCellClick={handleCellClick}
          onCellDragStart={handleCellDragStart}
          onCellDrag={handleCellDrag}
        />
      </div>
      { user && <div>Signed in as { user.displayName || user.email || user.uid }</div> }
    </div>
  );
};

export default EditPage;
