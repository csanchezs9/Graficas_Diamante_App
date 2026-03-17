import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#141414",
          borderTopColor: "#2A2A2A",
          borderTopWidth: 0.5,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#666666",
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Máquinas",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mantenimientos"
        options={{
          title: "Mantenimiento",
          tabBarIcon: ({ color, size }) => (
            <Feather name="tool" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="repuestos"
        options={{
          title: "Repuestos",
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="metricas"
        options={{
          title: "Métricas",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
