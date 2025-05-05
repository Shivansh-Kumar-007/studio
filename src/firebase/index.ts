import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import firebaseConfig from './config';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes and returns Firebase instances (app, auth, firestore).
 * Handles emulator connection in development environment.
 *
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
export function getFirebase() {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    firestore = getFirestore(app);

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
       // Check if emulators are already connected to prevent multiple connections
       // Firebase SDK throws an error if you try to connect to the emulators more than once.
      const isAuthEmulatorConnected = (auth.config.emulator?.hostname);
      const isFirestoreEmulatorConnected = (firestore.toJSON() as any).settings?.host?.includes('localhost'); // A bit hacky, check internal settings

      if (!isAuthEmulatorConnected) {
        try {
            console.log('Connecting to Auth emulator');
            connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        } catch (e) {
           console.warn("Failed to connect to Auth emulator:", e);
        }

      } else {
         console.log('Auth emulator already connected.');
      }

      if (!isFirestoreEmulatorConnected) {
         try {
            console.log('Connecting to Firestore emulator');
            connectFirestoreEmulator(firestore, 'localhost', 8080);
         } catch(e) {
            console.warn("Failed to connect to Firestore emulator:", e);
         }
      } else {
         console.log('Firestore emulator already connected.');
      }
    }
  }

  return { app, auth, firestore };
}
