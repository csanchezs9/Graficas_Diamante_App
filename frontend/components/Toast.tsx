import { useEffect, useRef } from "react";
import { View, Text, Animated, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

export type ToastType = "error" | "success" | "warning";

interface Props {
  visible: boolean;
  type: ToastType;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

const config: Record<ToastType, { icon: React.ComponentProps<typeof Feather>["name"]; color: string; bg: string; border: string }> = {
  error: { icon: "alert-circle", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  success: { icon: "check-circle", color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  warning: { icon: "alert-triangle", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
};

export default function Toast({ visible, type, message, onDismiss, duration = 3500 }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const c = config[type];

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 50,
        left: 20,
        right: 20,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Pressable
        onPress={dismiss}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#1A1A1A",
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 14,
          padding: 14,
          gap: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: c.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={c.icon} size={18} color={c.color} />
        </View>
        <Text
          style={{
            flex: 1,
            color: "#E0E0E0",
            fontSize: 14,
            fontFamily: "Inter_500Medium",
            lineHeight: 20,
          }}
          numberOfLines={3}
        >
          {message}
        </Text>
        <Feather name="x" size={16} color="#555" />
      </Pressable>
    </Animated.View>
  );
}
