import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";

let recording: Audio.Recording | null = null;

/**
 * Solicita permisos de audio
 */
export const requestAudioPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso Denegado",
        "Se necesita permiso para grabar audio"
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[requestAudioPermissions] Error:", error);
    return false;
  }
};

/**
 * Inicia la grabación de audio en formato WAV
 */
export const startRecording = async (): Promise<boolean> => {
  try {
    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) {
      return false;
    }

    // Configurar el modo de audio
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    console.log("[startRecording] Iniciando grabación...");

    // Configuración para WAV
    const recordingOptions = {
      android: {
        extension: ".wav",
        outputFormat: Audio.AndroidOutputFormat.DEFAULT,
        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: ".wav",
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: "audio/wav",
        bitsPerSecond: 128000,
      },
    };

    const { recording: newRecording } = await Audio.Recording.createAsync(
      recordingOptions
    );

    recording = newRecording;
    console.log("[startRecording] Grabación iniciada");
    return true;
  } catch (error: any) {
    console.error("[startRecording] Error:", error?.message || error);
    Alert.alert("Error", "No se pudo iniciar la grabación");
    return false;
  }
};

/**
 * Detiene la grabación y devuelve la URI del archivo WAV
 */
export const stopRecording = async (): Promise<string | null> => {
  try {
    if (!recording) {
      console.warn("[stopRecording] No hay grabación activa");
      return null;
    }

    console.log("[stopRecording] Deteniendo grabación...");
    await recording.stopAndUnloadAsync();
    
    // Resetear el modo de audio
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    recording = null;

    console.log("[stopRecording] Grabación guardada en:", uri);
    return uri;
  } catch (error: any) {
    console.error("[stopRecording] Error:", error?.message || error);
    Alert.alert("Error", "No se pudo detener la grabación");
    return null;
  }
};

/**
 * Verifica si hay una grabación en curso
 */
export const isRecording = (): boolean => {
  return recording !== null;
};

/**
 * Convierte un archivo de audio WAV a base64
 */
export const audioWavToBase64 = async (uri: string): Promise<string | null> => {
  try {
    console.log("[audioWavToBase64] Convirtiendo audio a base64:", uri);

    // Leer el archivo como base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    // Formato data URL para WAV
    const dataUrl = `data:audio/wav;base64,${base64}`;

    console.log("[audioWavToBase64] Conversión exitosa, tamaño:", dataUrl.length);
    return dataUrl;
  } catch (error: any) {
    console.error("[audioWavToBase64] Error:", error?.message || error);
    Alert.alert("Error", "No se pudo convertir el audio a base64");
    return null;
  }
};
