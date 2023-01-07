import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBHRmSN6BkP5qj6KG279_z8QUT809aTntM',
  authDomain: 'chatapp-ec7e1.firebaseapp.com',
  projectId: 'chatapp-ec7e1',
  storageBucket: 'chatapp-ec7e1.appspot.com',
  messagingSenderId: '857739954848',
  appId: '1:857739954848:web:8efd72d0adf48de7c5d7c5',
  measurementId: 'G-JNTQ1XSPD1'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const firestore = getFirestore(app)
