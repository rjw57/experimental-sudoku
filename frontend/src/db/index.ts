import firebase from 'firebase/app';
import 'firebase/firestore';

// We should be strict in what we send, flexible in what we receive.
export interface PuzzleDocument {
  title: string;
  ownerUid: string;
  createdAt: ReturnType<typeof firebase.firestore.FieldValue.serverTimestamp>;
  updatedAt: ReturnType<typeof firebase.firestore.FieldValue.serverTimestamp>;
  cells: {
    row: number;
    column: number;
    givenDigit: number;
  }[];
};

export const puzzlesCollection = (
  firestore?: firebase.firestore.Firestore
) => (
  (firestore || firebase.firestore()).collection('puzzles')
);

export const createPuzzle = async (
  user: firebase.User, firestore?: firebase.firestore.Firestore
) => (
  puzzlesCollection(firestore).add({
    title: 'Untitled puzzle',
    ownerUid: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    cells: [],
  })
);
