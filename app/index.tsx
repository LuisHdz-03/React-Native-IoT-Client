import { getColors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { homeStyles } from "@/styles/home.styles";
import { audioWavToBase64, startRecording, stopRecording } from "@/utils/audioRecorder";
import {
  ConnectionStatus,
  getStatusColor,
  getStatusIcon,
  getStatusText,
} from "@/utils/connectionStatus";
import { imageToDataUrl } from "@/utils/imageBase64";
import { takePhoto } from "@/utils/imageHelpers";
import { checkNodeRedConnection, closeWebSocket, sendToNodeRed } from "@/utils/websocketHelpers";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<
    "image" | "audio" | null
  >(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState<
    boolean | null
  >(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);

  useEffect(() => {
    // Verificar conexión con Node-RED al montar
    checkNodeRedConnection().then((isConnected) => {
      setConnectionStatus(isConnected ? "connected" : "disconnected");
      if (!isConnected) {
        console.warn(
          "[HomeScreen] Node-RED no está disponible. Verifica que esté corriendo."
        );
      }
    });

    // Cleanup: cerrar WebSocket al desmontar
    return () => {
      closeWebSocket();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");

      if (Platform.OS !== "web") {
        const galleryStatus =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasGalleryPermission(galleryStatus.status === "granted");
      }
    })();
  }, []);

  const handleTakePhoto = () => {
    takePhoto(hasCameraPermission, async (uri) => {
      setSelectedImage(uri);
      setSelectedMediaType("image");
    });
  };

  const handleSendImage = async () => {
    if (!selectedImage) return;

    try {
      setConnectionStatus("sending");

      if (selectedMediaType === "image") {
        console.log("[handleSendImage] Iniciando envío de imagen a Node-RED");

        // 1. Convertir a base64 con compresión
        const base64DataUrl = await imageToDataUrl(selectedImage, {
          width: 1024,
          compress: 0.6,
        });

        if (!base64DataUrl) {
          throw new Error("No se pudo convertir la imagen a base64");
        }

        console.log(
          "[handleSendImage] Base64 generado, tamaño:",
          base64DataUrl.length
        );

        // 2. Enviar a Node-RED
        const success = await sendToNodeRed("imagen", base64DataUrl);

        if (!success) {
          throw new Error(
            "No se pudo enviar a Node-RED. Verifica la conexión WebSocket"
          );
        }

        // Éxito
        setConnectionStatus("received");
        Alert.alert("Éxito", "Imagen enviada a Node-RED correctamente");
      } else if (selectedMediaType === "audio") {
        console.log("[handleSendImage] Iniciando envío de audio a Node-RED");

        // 1. Convertir audio WAV a base64
        const base64DataUrl = await audioWavToBase64(selectedImage);

        if (!base64DataUrl) {
          throw new Error("No se pudo convertir el audio a base64");
        }

        console.log(
          "[handleSendImage] Audio base64 generado, tamaño:",
          base64DataUrl.length
        );

        // 2. Enviar a Node-RED
        const success = await sendToNodeRed("audio", base64DataUrl);

        if (!success) {
          throw new Error(
            "No se pudo enviar a Node-RED. Verifica la conexión WebSocket"
          );
        }

        setConnectionStatus("received");
        Alert.alert("Éxito", "Audio enviado a Node-RED correctamente");
      }
    } catch (error: any) {
      console.error("[handleSendImage] Error:", error);
      setConnectionStatus("disconnected");
      Alert.alert(
        "Error",
        error?.message ||
          "Falló el envío. Verifica que Node-RED esté corriendo."
      );
    }
  };

  const toggleConnection = () => {
    setConnectionStatus((prev) =>
      prev === "connected" ? "disconnected" : "connected"
    );
  };

  const handleRecordAudio = async () => {
    if (isRecordingAudio) {
      // Detener grabación
      const audioUri = await stopRecording();
      setIsRecordingAudio(false);

      if (audioUri) {
        setSelectedImage(audioUri);
        setSelectedMediaType("audio");
        Alert.alert("Éxito", "Audio grabado correctamente");
      }
    } else {
      // Iniciar grabación
      const started = await startRecording();
      if (started) {
        setIsRecordingAudio(true);
        setSelectedImage(null);
        setSelectedMediaType(null);
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedImage(null);
    setSelectedMediaType(null);
    setConnectionStatus("connected");
  };

  return (
    <View
      style={[homeStyles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          homeStyles.header,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[homeStyles.headerTitle, { color: colors.text }]}>
          Captura de Fotos y Grabación de Audio
        </Text>
        <TouchableOpacity
          style={[
            homeStyles.statusBadge,
            { backgroundColor: getStatusColor(connectionStatus, colors) },
          ]}
          onPress={toggleConnection}
        >
          <Ionicons
            name={getStatusIcon(connectionStatus)}
            size={20}
            color="#FFFFFF"
            style={homeStyles.statusIcon}
          />
          <Text style={homeStyles.statusText}>
            {getStatusText(connectionStatus)}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={homeStyles.content}>
        <View
          style={[
            homeStyles.imageContainer,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          {selectedImage && selectedMediaType === "image" ? (
            <Image source={{ uri: selectedImage }} style={homeStyles.image} />
          ) : selectedImage && selectedMediaType === "audio" ? (
            <View style={homeStyles.placeholderContainer}>
              <Ionicons
                name="musical-notes"
                size={80}
                color={colors.success}
                style={homeStyles.placeholderIcon}
              />
              <Text
                style={[homeStyles.placeholderSubtext, { color: colors.text }]}
              >
                Audio listo para enviar
              </Text>
            </View>
          ) : isRecordingAudio ? (
            <View style={homeStyles.placeholderContainer}>
              <Ionicons
                name="mic"
                size={80}
                color={colors.error}
                style={homeStyles.placeholderIcon}
              />
              <Text
                style={[homeStyles.placeholderSubtext, { color: colors.error }]}
              >
                🔴 Grabando audio...
              </Text>
            </View>
          ) : (
            <View style={homeStyles.placeholderContainer}>
              <Ionicons
                name="camera-outline"
                size={80}
                color={colors.text}
                style={homeStyles.placeholderIcon}
              />
              <Text
                style={[homeStyles.placeholderSubtext, { color: colors.text }]}
              >
                No hay imagen o audio seleccionado
              </Text>
            </View>
          )}
        </View>

        <View style={homeStyles.buttonContainer}>
          {selectedImage ? (
            <TouchableOpacity
              style={[
                homeStyles.iconButton,
                { backgroundColor: colors.success },
              ]}
              onPress={handleSendImage}
            >
              <Ionicons name="send" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                homeStyles.iconButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              homeStyles.iconButton, 
              { 
                backgroundColor: isRecordingAudio ? colors.error : colors.primary 
              }
            ]}
            onPress={handleRecordAudio}
          >
            <Ionicons 
              name={isRecordingAudio ? "stop-circle" : "mic"} 
              size={28} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          {selectedImage && (
            <TouchableOpacity
              style={[
                homeStyles.iconButton,
                { backgroundColor: colors.warning || "#FF9500" },
              ]}
              onPress={handleClearSelection}
            >
              <Ionicons name="refresh" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {selectedImage && selectedMediaType === "audio" && (
          <View
            style={[
              homeStyles.infoCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="musical-notes"
              size={20}
              color={colors.text}
              style={homeStyles.infoIcon}
            />
            <Text style={[homeStyles.infoText, { color: colors.text }]}>
              Audio seleccionado exitosamente
            </Text>
          </View>
        )}

        {selectedImage && selectedMediaType === "image" && (
          <View
            style={[
              homeStyles.infoCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.text}
              style={homeStyles.infoIcon}
            />
            <Text style={[homeStyles.infoText, { color: colors.text }]}>
              Imagen cargada exitosamente
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
