import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('./serviceAccountKey.json'); // I need to get credentials, or just use firebase admin?
// I can't easily do this if I don't have the admin SDK credentials.
