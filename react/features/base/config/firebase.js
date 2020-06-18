import firebase from 'firebase';

//FIX - save sensitive info on process.env instead
const config = {
    apiKey: "AIzaSyCql_9OhnHf-sB5TRsvHCRzDDKzyP7cBEQ",
    authDomain: "apne-150d0.firebaseapp.com",
    databaseURL: "https://apne-150d0.firebaseio.com",
    projectId: "apne-150d0",
    storageBucket: "apne-150d0.appspot.com",
    messagingSenderId: "980063013430",
    appId: "1:980063013430:web:b990c8b1d8b2111643e697",
    measurementId: "G-N3Q24EFLQW"
};
firebase.initializeApp(config);
export const auth = firebase.auth;
export const db = firebase.database();