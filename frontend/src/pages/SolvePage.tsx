import { useRef, useEffect, useState, useMemo, useCallback, KeyboardEvent } from 'react';
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
  TextField,
  Theme,
  Typography,
  createStyles,
  makeStyles,
} from '@material-ui/core';

import { Puzzle } from '../components';
import { updatePuzzle, puzzlesCollection, PuzzleDocument } from '../db';
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
  const fixedCells: PuzzleDocument["cells"] = (
    (puzzleDocument && puzzleDocument.data().cells) || []
  );

  const canEdit = (
    user && user.uid && puzzleDocument && (puzzleDocument.data().ownerUid === user.uid)
  );
  const [isEditing, setIsEditing] = useState(false);

  const [
    { cellsHistory, selection, cursorRow, cursorColumn }, dispatch
  ] = usePuzzleController([], isEditing ? [] : fixedCells);
  const {
    handleKeyDown: handleSelectionKeyDown, handleCellClick, handleCellDragStart, handleCellDrag
  } = useSelectionBehaviour(dispatch);
  const [mode, setMode] = useState<EditMode>('digit');
  const [title, setTitle] = useState('');
  const { handleKeyDown: handleEditKeyDown } = useEditBehaviour(isEditing ? 'given' : mode, dispatch);

  const cells = cellsHistory[cellsHistory.length-1];
  const isSolved = useMemo(() => checkSudoku(cells), [cells]);

  const [puzzleDivRef, { width, height }] = useMeasure<HTMLDivElement>();
  const cellSize = Math.min(width, height) / 9;

  const wasEditingRef = useRef(false);
  useEffect(() => {
    if(!isEditing && wasEditingRef.current) {
      const newCells: { row: number; column: number; givenDigit: number }[] = [];
      cells.forEach((rowElems, row) => rowElems.forEach(({ givenDigit }, column) => {
        if(givenDigit) {
          newCells.push({ row, column, givenDigit });
        }
      }));
      puzzlesCollection().doc(puzzleId).set(updatePuzzle(
        puzzleDocument.data(), { title, cells: newCells }
      ));
    }
    wasEditingRef.current = isEditing;
  }, [isEditing, cells, puzzleDocument, puzzleId, title]);

  useEffect(() => {
    if(!puzzleDocument) { return; }
    const { cells, title } = puzzleDocument.data();
    setTitle(title || 'Untitled');
    if(!cells) { return; }
  }, [puzzleDocument, setTitle, dispatch]);

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

  let mergedCells = cells;
  fixedCells.forEach(({ row, column, givenDigit }) => {
    while(mergedCells.length <= row) { mergedCells = [...mergedCells, []]; }
    while(mergedCells[row].length <= column) { mergedCells[row] = [...mergedCells[row], {}]; }
    mergedCells = [
      ...mergedCells.slice(0, row),
      [
        ...mergedCells[row].slice(0, column),
        { givenDigit },
        ...mergedCells[row].slice(column+1),
      ],
      ...mergedCells.slice(row+1),
    ];
  });

  return (
    <div className={classes.root}>
      { !isEditing && <Typography variant="h5">{ title }</Typography> }
      {
        isEditing && <TextField
          label="Title" variant="outlined" value={title}
          onChange={event => setTitle(event.target.value)}
        />
      }
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
          selection={selection} cells={mergedCells}
          cursorRow={cursorRow} cursorColumn={cursorColumn}
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
    </div>
  );
};

export default SolvePage;
