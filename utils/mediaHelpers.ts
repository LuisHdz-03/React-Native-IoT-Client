import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";

export const pickMediaFile = async (
  onSuccess: (uri: string, type: "image" | "audio") => void
): Promise<void> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "audio/*"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || "";
      
      // Determinar si es imagen o audio
      const isImage = mimeType.startsWith("image/");
      const isAudio = mimeType.startsWith("audio/");
      
      if (isImage) {
        onSuccess(asset.uri, "image");
      } else if (isAudio) {
        onSuccess(asset.uri, "audio");
      } else {
        Alert.alert("Error", "Solo se permiten imágenes o archivos de audio");
      }
    }
  } catch (error) {
    Alert.alert("Error", "No se pudo seleccionar el archivo");
  }
};
