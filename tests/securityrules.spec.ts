import * as firebase from '@firebase/rules-unit-testing';
import * as firebaseAdmin from 'firebase-admin';

interface PuzzleDocument {
  title?: string;
  ownerUid?: string;
  cells?: {
    row: number;
    column: number;
    givenDigit: number;
  }[];
  createdAt?: object;
  updatedAt?: object;
};

interface CreatePuzzleFixtureOptions {
  usingAdmin?: boolean;
};

const createPuzzleFixture = (
  ownerUid: string, options: CreatePuzzleFixtureOptions = {}
): PuzzleDocument => {
  const { usingAdmin = false } = options;
  return {
    ownerUid,
    title: 'A test puzzle',
    cells: [
      { row: 3, column: 8, givenDigit: 6 },
    ],
    createdAt: (usingAdmin ? firebaseAdmin : firebase).firestore.FieldValue.serverTimestamp(),
    updatedAt: (usingAdmin ? firebaseAdmin : firebase).firestore.FieldValue.serverTimestamp(),
  };
};

interface UpdatePuzzleOptions {
  usingAdmin?: boolean;
};

const updatePuzzle = (
  oldPuzzle: PuzzleDocument,
  newPuzzle: {[key: string]: any},
  options: UpdatePuzzleOptions = {}
) => ({
  ...oldPuzzle,
  ...newPuzzle,
  updatedAt: (options.usingAdmin ? firebaseAdmin : firebase).firestore.FieldValue.serverTimestamp(),
});

describe('Firestore security rules', () => {
  const projectId = 'test-project';
  const adminApp = firebase.initializeAdminApp({ projectId });

  // Make sure the firestore is cleared before and after each test.
  beforeEach(async () => firebase.clearFirestoreData({ projectId }));
  afterEach(async () => firebase.clearFirestoreData({ projectId }));

  describe('with no user signed in', () => {
    const app = firebase.initializeTestApp({ projectId });
    const puzzlesCollection = app.firestore().collection('puzzles');
    const adminPuzzlesCollection = adminApp.firestore().collection('puzzles');

    it('should disallow reads from arbitrary collections', async () => {
      await adminApp.firestore().collection('testing').doc('test').set({ data: 'foo' });
      await firebase.assertFails(app.firestore().collection('testing').doc('test').get());
    });

    it('should disallow writes to arbitrary collections', async () => {
      await firebase.assertFails(
        app.firestore().collection('testing').doc('test').set({ data: 'foo' })
      );
    });

    describe('with an existing puzzle', () => {
      const puzzleId = 'testing-id';

      beforeEach(async () => {
        await adminPuzzlesCollection.doc(puzzleId).set(
          createPuzzleFixture('admin', { usingAdmin: true })
        );
      });

      it('should allow the puzzle to be read', async () => {
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).get());
      });
    });

    it('should disallow puzzle creation', async () => {
      await firebase.assertFails(
        puzzlesCollection.add(createPuzzleFixture('someUser'))
      );
    });
  });

  describe('with a test user', () => {
    const testUid = 'test-user';
    const app = firebase.initializeTestApp({ projectId, auth: { uid: testUid } });
    const puzzlesCollection = app.firestore().collection('puzzles');
    const adminPuzzlesCollection = adminApp.firestore().collection('puzzles');

    describe('with an existing puzzle', () => {
      const puzzleId = 'testing-id';

      beforeEach(async () => {
        await adminPuzzlesCollection.doc(puzzleId).set({
          ...createPuzzleFixture(testUid, { usingAdmin: true }),
          updatedAt: firebaseAdmin.firestore.Timestamp.fromMillis(
            firebaseAdmin.firestore.Timestamp.now().toMillis() - 20000
          ),
        });
      });

      it('should allow the puzzle to be read', async () => {
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).get());
      });

      it('should allow null updates', async () => {
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, {})
        ));
      });

      it('should require the current user to own the document', async () => {
        await adminPuzzlesCollection.doc(puzzleId).set(
          createPuzzleFixture(`${testUid}-other`, { usingAdmin: true })
        );
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertFails(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, {})
        ));
      });

      it('should allow title to be updated', async () => {
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, { title: 'hello' })
        ));
      });

      it('should allow cells to be updated', async () => {
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, { cells: [{ row: 5, column: 6, givenDigit: 8}] })
        ));
      });

      it('should forbid ownerUid to be updated', async () => {
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertFails(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, { ownerUid: 'foo' })
        ));
      });

      it('should forbid createdAt to be updated', async () => {
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertFails(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, { createdAt: firebase.firestore.FieldValue.serverTimestamp() })
        ));
      });

      it('should forbid updatedAt to not be "now"', async () => {
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertFails(puzzlesCollection.doc(puzzleId).set(
          { ...updatePuzzle(existingDoc, {}), updatedAt: existingDoc.createdAt }
        ));
      });

      it('should forbid extra fields', async () => {
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertFails(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, { extraField: 'foo' })
        ));
      });

      ['createdAt', 'title', 'cells', 'ownerUid'].forEach(key => (
        it(`should forbid deleting the "${key}" field`, async () => {
          const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
          delete existingDoc[key];
          await firebase.assertFails(puzzlesCollection.doc(puzzleId).set(
            updatePuzzle(existingDoc, {})
          ));
        })
      ));

      it('should forbid updates if previous updatedAt was not long enough ago', async () => {
        const existingAdminDoc = (await adminPuzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertSucceeds(adminPuzzlesCollection.doc(puzzleId).set({
          ...existingAdminDoc,
          updatedAt: firebaseAdmin.firestore.Timestamp.fromMillis(
            firebaseAdmin.firestore.Timestamp.now().toMillis() - 10
          ),
        }));
        const existingDoc = (await puzzlesCollection.doc(puzzleId).get()).data() as PuzzleDocument;
        await firebase.assertFails(puzzlesCollection.doc(puzzleId).set(
          updatePuzzle(existingDoc, {})
        ));
      });
    });

    describe('puzzle creation', () => {
      it('should succeed', async () => {
        await firebase.assertSucceeds(puzzlesCollection.add(createPuzzleFixture(testUid)));
      });

      it('should fail if the uid does not match the current user', async () => {
        await firebase.assertFails(puzzlesCollection.add(createPuzzleFixture(testUid + '-suffix')));
      });

      it('should fail if extra keys are provided', async () => {
        await firebase.assertFails(puzzlesCollection.add({
          ...createPuzzleFixture(testUid), otherKey: 'foo'
        }));
      });

      ['updatedAt', 'createdAt', 'cells', 'ownerUid', 'title'].forEach(key => (
        it(`should fail if "${key}" key is not present`, async () => {
          const puzzle = createPuzzleFixture(testUid);
          delete puzzle[key];
          await firebase.assertFails(puzzlesCollection.add(puzzle));
        })
      ));

      it('should fail if the title is too short', async () => {
        await firebase.assertFails(puzzlesCollection.add({
          ...createPuzzleFixture(testUid), title: 'x',
        }));
      });

      it('should fail if the timestamp is not "now"', async () => {
        await firebase.assertFails(puzzlesCollection.add({
          ...createPuzzleFixture(testUid),
          createdAt: firebase.firestore.Timestamp.fromDate(
            new Date('2021-01-04T21:52:08+00:00'),
          ),
        }));
      });
    });
  });
});
