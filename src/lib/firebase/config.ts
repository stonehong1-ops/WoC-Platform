// Firebase configuration only — instance initialization is in clientApp.ts

const sanitize = (val: string | undefined) => {
  if (!val) return "";
  return val.replace(/\\r|\\n|\r|\n|"/g, "").trim();
};

export const firebaseConfig = {
  apiKey: sanitize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
};
