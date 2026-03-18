import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  subtitle?: string;
  accentColor?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  subtitle,
  accentColor = "#3B82F6",
}: MetricCardProps) {
  return (
    <View className="flex-1 bg-surface border-[0.5px] border-border rounded-2xl p-4">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        <Feather name={icon as any} size={18} color={accentColor} />
      </View>
      <Text className="text-textMuted text-[11px] font-inter-medium uppercase tracking-widest mb-1">
        {title}
      </Text>
      <Text
        className="text-textPrimary text-xl font-inter-bold"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {subtitle && (
        <Text className="text-textMuted text-[11px] font-inter-regular mt-0.5">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
