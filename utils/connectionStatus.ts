export type ConnectionStatus =
  | "connected"
  | "sending"
  | "received"
  | "disconnected";

export const getStatusColor = (
  status: ConnectionStatus,
  colors: {
    success: string;
    warning: string;
    primary: string;
    error: string;
    border: string;
  }
) => {
  switch (status) {
    case "connected":
      return colors.success;
    case "sending":
      return colors.warning;
    case "received":
      return colors.primary;
    case "disconnected":
      return colors.error;
    default:
      return colors.border;
  }
};

export const getStatusText = (status: ConnectionStatus) => {
  switch (status) {
    case "connected":
      return "Conectado";
    case "sending":
      return "Enviando...";
    case "received":
      return "Enviado";
    case "disconnected":
      return "Desconectado";
    default:
      return "Sin conexión";
  }
};

export const getStatusIcon = (status: ConnectionStatus) => {
  switch (status) {
    case "connected":
      return "checkmark-circle";
    case "sending":
      return "cloud-upload"; // Envío en progreso
    case "received":
      return "cloud-done"; // Enviado
    case "disconnected":
      return "close-circle";
    default:
      return "help-circle";
  }
};
