// Configuración de Firebase
// Rellena estos campos con los valores de tu proyecto Firebase (Project settings > General > Your apps > SDK setup and configuration)
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY ,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_ID_PROYECT,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE,
  messagingSenderId: process.env.EXPO_PUBLIC_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_ID_APP,
  measurementId: process.env.EXPO_PUBLIC_ID_MEASURE,

  
  databaseURL: process.env.EXPO_PUBLIC_DATABASE_URL,
};
