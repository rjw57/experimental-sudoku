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
});
