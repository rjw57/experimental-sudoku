import * as firebase from '@firebase/rules-unit-testing';
import * as firebaseAdmin from 'firebase-admin';

interface CreatePuzzleFixtureOptions {
  usingAdmin?: boolean;
}

const createPuzzleFixture = (ownerUid: string, options: CreatePuzzleFixtureOptions = {}) => {
  const { usingAdmin = false } = options;
  return {
    ownerUid,
    title: 'A test puzzle',
    cells: [
      { row: 3, column: 8, givenDigit: 6 },
    ],
    createdAt: (usingAdmin ? firebaseAdmin : firebase).firestore.FieldValue.serverTimestamp(),
  };
};

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
        await adminPuzzlesCollection.doc(puzzleId).set(
          createPuzzleFixture('admin', { usingAdmin: true })
        );
      });

      it('should allow the puzzle to be read', async () => {
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).get());
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

      ['createdAt', 'cells', 'ownerUid', 'title'].forEach(key => (
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
