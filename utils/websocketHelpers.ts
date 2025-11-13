import { SOCKET_CONFIG, getUserName } from "@/constants/socketConfig";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let messageQueue: any[] = [];

/**
 * Inicializa la conexión WebSocket con Node-RED
 */
export const initWebSocket = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Convertir https a wss y http a ws
      const wsUrl = SOCKET_CONFIG.url.replace("https://", "wss://").replace("http://", "ws://");
      const fullUrl = `${wsUrl}/ws`;
      
      console.log("[WebSocket] Conectando a:", fullUrl);
      
      ws = new WebSocket(fullUrl);

      ws.onopen = () => {
        console.log("[WebSocket] Conectado exitosamente");
        
        // Enviar mensajes pendientes
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift();
          ws?.send(JSON.stringify(msg));
        }
        
        resolve(true);
      };

      ws.onmessage = (event) => {
        console.log("[WebSocket] Mensaje recibido:", event.data);
        try {
          const data = JSON.parse(event.data);
          // Aquí puedes manejar respuestas de Node-RED si las hay
          console.log("[WebSocket] Datos parseados:", data);
        } catch (error) {
          console.log("[WebSocket] Mensaje no JSON:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        resolve(false);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Conexión cerrada");
        ws = null;
        
        // Intentar reconectar después de 5 segundos
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          console.log("[WebSocket] Intentando reconectar...");
          initWebSocket();
        }, 5000);
      };

      // Timeout de 10 segundos para la conexión inicial
      setTimeout(() => {
        if (ws?.readyState !== WebSocket.OPEN) {
          console.warn("[WebSocket] Timeout de conexión");
          ws?.close();
          resolve(false);
        }
      }, 10000);

    } catch (error) {
      console.error("[WebSocket] Error al inicializar:", error);
      resolve(false);
    }
  });
};

/**
 * Verifica si el WebSocket está conectado
 */
export const isWebSocketConnected = (): boolean => {
  return ws?.readyState === WebSocket.OPEN;
};

/**
 * Envía datos a Node-RED vía WebSocket
 */
export const sendToNodeRed = async (
  tipo: "imagen" | "audio",
  dataUrl: string
): Promise<boolean> => {
  try {
    const payload = {
      tipo,
      data: dataUrl,
      metadata: {
        usuario: getUserName(),
        timestamp: new Date().toISOString(),
      },
    };

    console.log("[sendToNodeRed] Preparando envío:", {
      tipo,
      usuario: payload.metadata.usuario,
      dataLength: dataUrl.length,
    });

    // Si el WebSocket no está conectado, intentar conectar
    if (!isWebSocketConnected()) {
      console.log("[sendToNodeRed] WebSocket no conectado, iniciando conexión...");
      const connected = await initWebSocket();
      
      if (!connected) {
        console.error("[sendToNodeRed] No se pudo conectar al WebSocket");
        return false;
      }
      
      // Esperar un momento para asegurar que la conexión esté lista
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Enviar el mensaje
    if (isWebSocketConnected() && ws) {
      ws.send(JSON.stringify(payload));
      console.log("[sendToNodeRed] Mensaje enviado exitosamente");
      return true;
    } else {
      // Si aún no está conectado, agregar a la cola
      console.log("[sendToNodeRed] Agregando mensaje a la cola");
      messageQueue.push(payload);
      return false;
    }
  } catch (error: any) {
    console.error("[sendToNodeRed] Error:", error?.message || error);
    return false;
  }
};

/**
 * Verifica la conexión con Node-RED
 */
export const checkNodeRedConnection = async (): Promise<boolean> => {
  if (isWebSocketConnected()) {
    return true;
  }
  
  return await initWebSocket();
};

/**
 * Cierra la conexión WebSocket
 */
export const closeWebSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (ws) {
    ws.close();
    ws = null;
  }
  
  messageQueue = [];
  console.log("[WebSocket] Conexión cerrada manualmente");
};
