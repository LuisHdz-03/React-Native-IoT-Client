import * as Device from "expo-device";
// Aqui namas configuras el url del nodered y si
export const SOCKET_CONFIG = {
  url: "https://cormoid-annika-unenforcedly.ngrok-free.dev",
  options: {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  },
};

export const getUserName = () => {
  // en vez de usuario se manda el modelo del dispositivo segun yo pero esperemos que jale
  return Device.modelName || "Dispositivo_Desconocido";
};
