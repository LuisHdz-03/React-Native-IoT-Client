import { SOCKET_CONFIG } from "@/constants/socketConfig";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);

    socket.on("connect", () => {
      console.log("Socket conectado:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket desconectado");
    });

    socket.on("error", (error) => {
      console.error("Error en socket:", error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

export type MessageType = "imagen" | "audio";

export interface SocketMessage {
  tipo: MessageType;
  data: string;
  metadata: {
    usuario: string;
    timestamp: string;
  };
}

export const sendToNodeRed = (
  tipo: MessageType,
  data: string,
  usuario: string
): boolean => {
  if (!socket || !socket.connected) {
    console.error("Socket no está conectado");
    return false;
  }

  const message: SocketMessage = {
    tipo,
    data,
    metadata: {
      usuario,
      timestamp: new Date().toISOString(),
    },
  };

  socket.emit("mensaje", message);
  console.log(`Mensaje ${tipo} enviado a Node-RED`);
  return true;
};
