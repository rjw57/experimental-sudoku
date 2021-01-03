import * as firebase from '@firebase/rules-unit-testing';

describe('Firestore security rules', () => {
  const projectId = 'test-project';
  const adminApp = firebase.initializeAdminApp({ projectId });

  describe('with no user signed in', () => {
    const app = firebase.initializeTestApp({ projectId });

    it('should disallow anonymous reads from arbitrary collections', async () => {
      await adminApp.firestore().collection('testing').doc('test').set({ data: 'foo' });
      await firebase.assertFails(app.firestore().collection('testing').doc('test').get());
    });

    it('should disallow anonymous writes to arbitrary collections', async () => {
      await firebase.assertFails(
        app.firestore().collection('testing').doc('test').set({ data: 'foo' })
      );
    });
  });

  describe('with an existing puzzle', () => {
    const puzzleId = 'testing-id';
    const adminPuzzlesCollection = adminApp.firestore().collection('puzzles');

    beforeEach(async () => {
      await firebase.clearFirestoreData({ projectId });
      await adminPuzzlesCollection.doc(puzzleId).set({
        cells: [
          { row: 3, column: 8, givenDigit: 6 },
        ],
      });
    });

    describe('with no user signed in', () => {
      const app = firebase.initializeTestApp({ projectId });
      const puzzlesCollection = app.firestore().collection('puzzles');

      it('should allow the puzzle to be read', async () => {
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).get());
      });
    });

    describe('with a user signed in', () => {
      const app = firebase.initializeTestApp({ projectId, auth: { uid: 'testUser' } });
      const puzzlesCollection = app.firestore().collection('puzzles');

      it('should allow the puzzle to be read', async () => {
        await firebase.assertSucceeds(puzzlesCollection.doc(puzzleId).get());
      });
    });

    afterEach(async () => {
      await firebase.clearFirestoreData({ projectId });
    });
  });
});
