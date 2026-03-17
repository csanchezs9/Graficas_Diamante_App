import { View, Text, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function MetricasScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16 }}>
        <Text style={{ color: "#F5F5F5", fontSize: 26, fontFamily: "Inter_700Bold" }}>
          Métricas
        </Text>
        <Text style={{ color: "#666", fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 }}>
          Dashboard y reportes
        </Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#141414",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Feather name="bar-chart-2" size={36} color="#2A2A2A" />
        </View>
        <Text style={{ color: "#A0A0A0", fontSize: 16, fontFamily: "Inter_500Medium", marginBottom: 6 }}>
          Próximamente
        </Text>
        <Text
          style={{
            color: "#555",
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Visualización de datos{"\n"}y KPIs operativos
        </Text>
      </View>
    </View>
  );
}
