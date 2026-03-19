import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { View, ActivityIndicator } from "react-native";
import { ToastProvider, useToast } from "../context/ToastContext";
import { api } from "../services/api";

function DbHealthCheck() {
  const { showToast } = useToast();

  useEffect(() => {
    const check = async () => {
      try {
        const health = await api.getDbHealth();

        if (health.supabase === "unreachable") {
          showToast(
            "error",
            "No se pudo conectar a la base de datos. La app puede no funcionar correctamente. Contactar a Camilo."
          );
          return;
        }

        if (health.database && health.database.percent >= 90) {
          showToast(
            "warning",
            `La base de datos está al ${health.database.percent}% de capacidad. Contactar a Camilo para ampliar el almacenamiento.`
          );
        }

        if (health.storage && health.storage.percent >= 90) {
          showToast(
            "warning",
            `El almacenamiento de imágenes está al ${health.storage.percent}% de capacidad. Contactar a Camilo para ampliar el espacio.`
          );
        }
      } catch {
        // Server might be waking up (Render cold start), don't alarm the user
      }
    };

    // Small delay to let the app render first
    const timer = setTimeout(check, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ToastProvider>
      <DbHealthCheck />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0A" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="maquina/[id]" />
        <Stack.Screen name="mantenimiento/[id]" />
        <Stack.Screen name="repuesto/[id]" />
      </Stack>
    </ToastProvider>
  );
}
