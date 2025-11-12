import { SOCKET_CONFIG, getUserName } from "@/constants/socketConfig";

/**
 * Envía datos (imagen o audio) al endpoint de Node-RED vía HTTP POST
 * @param tipo - Tipo de medio: "imagen" o "audio"
 * @param dataUrl - Data URL en formato base64 (data:image/jpeg;base64,...)
 * @returns Promise<boolean> - true si se envió correctamente
 */
export const sendToNodeRed = async (
  tipo: "imagen" | "audio",
  dataUrl: string
): Promise<boolean> => {
  try {
    // Construir payload según formato solicitado
    const payload = {
      tipo,
      data: dataUrl,
      metadata: {
        usuario: getUserName(),
        timestamp: new Date().toISOString(),
      },
    };

    console.log("[sendToNodeRed] Enviando a Node-RED:", {
      tipo,
      usuario: payload.metadata.usuario,
      dataLength: dataUrl.length,
      url: `${SOCKET_CONFIG.url}/media`,
    });

    // Enviar al endpoint /media de Node-RED
    const response = await fetch(`${SOCKET_CONFIG.url}/media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[sendToNodeRed] Error HTTP:", response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log("[sendToNodeRed] Respuesta de Node-RED:", result);
    return true;
  } catch (error: any) {
    console.error("[sendToNodeRed] Error:", error?.message || error);
    return false;
  }
};

/**
 * Verifica la conexión con Node-RED
 * @returns Promise<boolean> - true si Node-RED está disponible
 */
export const checkNodeRedConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SOCKET_CONFIG.url}/health`, {
      method: "GET",
      timeout: 3000,
    } as any);
    return response.ok;
  } catch (error) {
    console.warn("[checkNodeRedConnection] Node-RED no disponible:", error);
    return false;
  }
};
