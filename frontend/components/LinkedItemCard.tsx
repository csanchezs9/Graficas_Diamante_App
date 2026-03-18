import { View, Text, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  imageUrl?: string | null;
  fallbackIcon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
  meta?: string;
  badgeLabel?: string;
  badgeColor?: string;
  badgeBg?: string;
  badgeIcon?: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}

export default function LinkedItemCard({
  imageUrl,
  fallbackIcon,
  title,
  subtitle,
  meta,
  badgeLabel,
  badgeColor,
  badgeBg,
  badgeIcon,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-surface border border-border rounded-2xl p-3 gap-3 active:opacity-90 active:scale-[0.98]"
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-11 h-11 rounded-[10px] bg-surfaceLight"
          resizeMode="cover"
        />
      ) : (
        <View className="w-11 h-11 rounded-[10px] bg-surfaceLight items-center justify-center">
          <Feather name={fallbackIcon} size={18} color="#333" />
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className={`text-[#F0F0F0] text-sm font-inter-medium flex-1 ${badgeLabel ? "mr-2" : ""}`}
          >
            {title}
          </Text>
          {badgeLabel && badgeColor && badgeBg && (
            <View
              className="flex-row items-center px-2 py-[3px] rounded-lg gap-1"
              style={{ backgroundColor: badgeBg }}
            >
              {badgeIcon && (
                <Feather name={badgeIcon} size={10} color={badgeColor} />
              )}
              <Text
                className="text-[10px] font-inter-semibold"
                style={{ color: badgeColor }}
              >
                {badgeLabel}
              </Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text
            numberOfLines={1}
            className="text-textMuted text-xs font-inter-regular mt-[3px]"
          >
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text
            numberOfLines={1}
            className="text-[#555] text-[11px] font-inter-regular mt-0.5"
          >
            {meta}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color="#444" />
    </Pressable>
  );
}
