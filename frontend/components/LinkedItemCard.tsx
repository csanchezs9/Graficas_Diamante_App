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
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#141414",
        borderWidth: 1,
        borderColor: "#2A2A2A",
        borderRadius: 12,
        padding: 12,
        gap: 12,
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: "#1E1E1E",
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: "#1E1E1E",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={fallbackIcon} size={18} color="#333" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: "#F0F0F0",
              fontSize: 14,
              fontFamily: "Inter_500Medium",
              flex: 1,
              marginRight: badgeLabel ? 8 : 0,
            }}
          >
            {title}
          </Text>
          {badgeLabel && badgeColor && badgeBg && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: badgeBg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                gap: 4,
              }}
            >
              {badgeIcon && (
                <Feather name={badgeIcon} size={10} color={badgeColor} />
              )}
              <Text
                style={{
                  color: badgeColor,
                  fontSize: 10,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {badgeLabel}
              </Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              color: "#666",
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              marginTop: 3,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text
            numberOfLines={1}
            style={{
              color: "#555",
              fontSize: 11,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
          >
            {meta}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color="#444" />
    </Pressable>
  );
}
