// Conversión a base64 sin usar API deprecada: fetch(uri) -> ArrayBuffer -> base64
const toBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // evitar stack overflow en strings grandes
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  // btoa está disponible en RN/JS runtime
  return typeof btoa !== "undefined"
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");
};

export const convertImageToBase64 = async (
  uri: string
): Promise<string | null> => {
  try {
    const res = await fetch(uri);
    const buffer = await res.arrayBuffer();
    const base64 = toBase64(buffer);
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error convirtiendo imagen a base64:", error);
    return null;
  }
};

export const convertAudioToBase64 = async (
  uri: string
): Promise<string | null> => {
  try {
    const res = await fetch(uri);
    const buffer = await res.arrayBuffer();
    const base64 = toBase64(buffer);
    return `data:audio/m4a;base64,${base64}`;
  } catch (error) {
    console.error("Error convirtiendo audio a base64:", error);
    return null;
  }
};
