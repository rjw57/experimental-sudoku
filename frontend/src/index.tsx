import React from 'react';
import ReactDOM from 'react-dom';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import firebaseAppConfig from './firebaseAppConfig';

// Initialise firebase
firebase.initializeApp(firebaseAppConfig);
firebase.auth().useDeviceLanguage();

if(process.env.NODE_ENV === 'development') {
  firebase.auth().useEmulator('http://localhost:9099/');
  firebase.firestore().useEmulator('localhost', 8080);
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
