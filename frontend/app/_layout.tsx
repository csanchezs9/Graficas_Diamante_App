import "../global.css";
import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { View } from "react-native";
import { ToastProvider, useToast } from "../context/ToastContext";
import { api } from "../services/api";

// Keep splash visible while fonts load
SplashScreen.preventAutoHideAsync();

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

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ToastProvider>
      <DbHealthCheck />
      <StatusBar style="light" />
      <View style={{ flex: 1 }} onLayout={onLayoutReady}>
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
      </View>
    </ToastProvider>
  );
}
