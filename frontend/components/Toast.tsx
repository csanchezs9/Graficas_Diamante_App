import { useEffect, useRef, useCallback } from "react";
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

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [translateY, opacity, onDismiss]);

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
  }, [visible, duration, dismiss]);

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
        className="flex-row items-center bg-[#1A1A1A] rounded-[14px] p-3.5 gap-3 shadow-lg shadow-black/40"
        style={{ borderWidth: 1, borderColor: c.border }}
      >
        <View
          className="w-9 h-9 rounded-[10px] items-center justify-center"
          style={{ backgroundColor: c.bg }}
        >
          <Feather name={c.icon} size={18} color={c.color} />
        </View>
        <Text
          className="flex-1 text-[#E0E0E0] text-sm font-inter-medium leading-5"
          numberOfLines={3}
        >
          {message}
        </Text>
        <Feather name="x" size={16} color="#555" />
      </Pressable>
    </Animated.View>
  );
}
