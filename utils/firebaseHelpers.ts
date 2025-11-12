import { FIREBASE_CONFIG } from "@/constants/firebaseConfig";
// Evitar API deprecada de expo-file-system; usaremos fetch -> Blob
import { FirebaseApp, getApps, initializeApp, setLogLevel } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  Firestore,
  getFirestore,
  initializeFirestore,
  Timestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  uploadString,
} from "firebase/storage";

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export const initFirebase = () => {
  if (!getApps().length) {
    app = initializeApp(FIREBASE_CONFIG);
    setLogLevel("debug");
    // Config Firestore para RN (evita problemas de WebChannel en algunas redes)
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }
  return app!;
};

const getServices = () => {
  const firebaseApp = initFirebase();
  const db = dbInstance ?? getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  return { db, storage };
};

export interface UploadResult {
  downloadUrl: string;
  docId: string;
}

// Guarda un documento con el formato solicitado que incluye el base64 incrustado (data URL)
// ADVERTENCIA: Firestore tiene un límite de 1MB por documento. Imágenes grandes (por ejemplo > ~300KB comprimidas) excederán ese límite si se guardan completas en base64.
// Para imágenes grandes conviene subir a Storage y guardar la URL (ya implementado arriba). Esta función asume que la cadena base64 es relativamente pequeña.
export const saveBase64MediaRecord = async (
  tipo: "imagen" | "audio",
  dataUrl: string,
  usuario: string
): Promise<string | null> => {
  try {
    const { db } = getServices();
    const docRef = await addDoc(collection(db, "media"), {
      tipo,
      data: dataUrl,
      metadata: {
        usuario,
        timestamp: new Date().toISOString(),
      },
    });
    return docRef.id;
  } catch (error) {
    console.warn("[saveBase64MediaRecord] Error guardando base64", error);
    return null;
  }
};

// Enviar JSON al Realtime Database vía REST (HTTPS). Requiere habilitar RTDB en Firebase Console.
export const saveMediaJsonToRealtime = async (payload: {
  tipo: "imagen" | "audio";
  data: string;
  metadata: { usuario: string; timestamp: string };
}): Promise<string | null> => {
  try {
    initFirebase();
    const auth = getAuth();
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    const idToken = await auth.currentUser?.getIdToken(true);
    const url = `${FIREBASE_CONFIG.databaseURL}/media.json${
      idToken ? `?auth=${idToken}` : ""
    }`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("[saveMediaJsonToRealtime] Error HTTP", res.status, text);
      return null;
    }
    const json = await res.json();
    // RTDB retorna { name: "-Nabc123..." }
    return json?.name ?? null;
  } catch (e) {
    console.warn("[saveMediaJsonToRealtime] Error", e);
    return null;
  }
};

const guessContentType = (uri: string, tipo: "imagen" | "audio") => {
  const lower = uri.toLowerCase();
  if (tipo === "imagen") {
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".heic")) return "image/heic";
    return "image/jpeg";
  } else {
    if (lower.endsWith(".m4a")) return "audio/m4a";
    if (lower.endsWith(".mp3")) return "audio/mpeg";
    if (lower.endsWith(".wav")) return "audio/wav";
    if (lower.endsWith(".aac")) return "audio/aac";
    return "audio/mpeg";
  }
};

export const uploadFileToStorage = async (
  localUri: string,
  folder: string,
  tipo: "imagen" | "audio"
): Promise<string | null> => {
  const { storage } = getServices();
  const fileName = `${folder}/${Date.now()}`;
  const fileRef = ref(storage, fileName);
  const contentType = guessContentType(localUri, tipo);
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    console.log("[upload] blob obtenido", {
      size: blob.size,
      type: blob.type,
      uri: localUri,
      contentType,
    });
    await uploadBytes(fileRef, blob, { contentType });
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (err: any) {
    console.warn("[upload] Error en uploadBytes", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
    });
    if (err?.serverResponse)
      console.warn("[upload] serverResponse", err.serverResponse);
    // Fallback base64
    try {
      const fs = require("expo-file-system/legacy");
      const base64Data = await fs.readAsStringAsync(localUri, {
        encoding: "base64",
      });
      console.log("[upload] fallback base64 length", base64Data.length);
      await uploadString(fileRef, base64Data, "base64", { contentType });
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (fallbackErr: any) {
      console.warn("[upload] Fallback base64 falló", {
        message: fallbackErr?.message,
        name: fallbackErr?.name,
      });
      return null;
    }
  }
};
export const saveMediaRecord = async (
  tipo: "imagen" | "audio",
  downloadUrl: string,
  usuario: string
): Promise<string | null> => {
  try {
    const { db } = getServices();
    const docRef = await addDoc(collection(db, "media"), {
      tipo,
      url: downloadUrl,
      usuario,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.warn("Error guardando en Firestore", error);
    return null;
  }
};

export const uploadMediaAndRecord = async (
  localUri: string,
  tipo: "imagen" | "audio",
  usuario: string
): Promise<UploadResult | null> => {
  const folder = tipo === "imagen" ? "imagenes" : "audios";
  const url = await uploadFileToStorage(localUri, folder, tipo);
  if (!url) return null;
  const docId = await saveMediaRecord(tipo, url, usuario);
  if (!docId) return null;
  return { downloadUrl: url, docId };
};
