# <img src="https://api.iconify.design/ph:cpu-bold.svg?color=%2338C2FF" height="32" valign="middle"/> IoT Media Client (React Native)

Aplicación móvil desarrollada con React Native (Expo) diseñada para la captura y transmisión de datos multimedia en tiempo real hacia flujos de automatización en **Node-RED**. Este cliente funciona como un puente entre los sensores del dispositivo móvil y arquitecturas IoT.

---

## <img src="https://api.iconify.design/ph:sparkle-bold.svg?color=%2338C2FF" height="28" valign="middle"/> Características Principales

*   **Captura de Hardware Nativo:** Integración con `expo-camera`, `expo-image-picker` y `expo-av` para captura de fotografías y grabación de audio directamente desde el dispositivo.
*   **Procesamiento en el Cliente:** Redimensión, compresión de imágenes y conversión de formatos de audio a cadenas Base64 para optimizar la transmisión de datos.
*   **Comunicación Bidireccional:** Envío de cargas útiles (Payloads en JSON) mediante conexiones de baja latencia usando **WebSockets** y respaldos vía HTTP POST.
*   **Almacenamiento en la Nube:** Arquitectura preparada y configurada para persistencia de archivos multimedia usando **Firebase Storage** y **Firestore**.

---

## <img src="https://api.iconify.design/ph:code-bold.svg?color=%2338C2FF" height="28" valign="middle"/> Stack Tecnológico

*   **Framework Core:** React Native 0.81 (Expo SDK 54 + Expo Router)
*   **Lenguaje:** TypeScript
*   **Comunicaciones:** Socket.IO / WebSockets Nativos / API Fetch
*   **Integración IoT:** Node-RED (vía túneles de ngrok)
*   **BaaS:** Firebase (Realtime Database, Storage, Firestore)

---

## <img src="https://api.iconify.design/ph:folder-open-bold.svg?color=%2338C2FF" height="28" valign="middle"/> Flujo de Datos (Data Flow)

Al capturar un archivo multimedia, el cliente empaqueta la información y la transmite al servidor Node-RED bajo la siguiente estructura JSON:

```json
{
  "tipo": "imagen | audio",
  "data": "data:image/jpeg;base64,...",
  "metadata": {
    "usuario": "modelo-del-dispositivo",
    "timestamp": "2026-09-24T20:19:42Z"
  }
}
