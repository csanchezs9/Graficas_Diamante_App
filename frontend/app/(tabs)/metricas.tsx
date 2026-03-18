import { View, Text, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function MetricasScreen() {
  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View className="px-5 pt-12 pb-4">
        <Text className="text-textPrimary text-[26px] font-inter-bold">
          Métricas
        </Text>
        <Text className="text-textMuted text-sm font-inter-regular mt-0.5">
          Dashboard y reportes
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-5">
        <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-5">
          <Feather name="bar-chart-2" size={36} color="#2A2A2A" />
        </View>
        <Text className="text-textSecondary text-base font-inter-medium mb-1.5">
          Próximamente
        </Text>
        <Text className="text-[#555] text-sm font-inter-regular text-center leading-5">
          Visualización de datos{"\n"}y KPIs operativos
        </Text>
      </View>
    </View>
  );
}
