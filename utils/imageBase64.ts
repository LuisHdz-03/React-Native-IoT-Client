import * as ImageManipulator from "expo-image-manipulator";

// Genera un Data URL (base64) optimizado para Firestore
// - Redimensiona a ancho 1024px manteniendo proporción
// - Comprime calidad ~0.6 en JPEG
export const imageToDataUrl = async (
  uri: string,
  options?: { width?: number; compress?: number }
): Promise<string | null> => {
  try {
    const width = options?.width ?? 1024;
    const compress = options?.compress ?? 0.6;
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (!result.base64) return null;
    return `data:image/jpeg;base64,${result.base64}`;
  } catch (e) {
    console.warn("[imageToDataUrl] Error generando base64", e);
    return null;
  }
};
