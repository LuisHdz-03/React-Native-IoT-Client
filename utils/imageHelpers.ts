import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const takePhoto = async (
  hasCameraPermission: boolean | null,
  onSuccess: (uri: string) => void
) => {
  if (hasCameraPermission === false) {
    Alert.alert("Sin permisos", "No tienes permisos para usar la cámara");
    return;
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onSuccess(result.assets[0].uri);
    }
  } catch (error) {
    Alert.alert("Error", "No se pudo tomar la foto");
  }
};

export const pickImage = async (
  hasGalleryPermission: boolean | null,
  onSuccess: (uri: string) => void
) => {
  if (hasGalleryPermission === false) {
    Alert.alert("Sin permisos", "No tienes permisos para acceder a la galería");
    return;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onSuccess(result.assets[0].uri);
    }
  } catch (error) {
    Alert.alert("Error", "No se pudo seleccionar la imagen");
  }
};
