import { useEffect, useRef } from "react";
import { View, Text, Pressable, Modal, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";

export interface ConfirmDialogAction {
  text: string;
  style?: "default" | "destructive" | "cancel";
  onPress?: () => void;
}

interface Props {
  visible: boolean;
  title: string;
  message: string;
  actions: ConfirmDialogAction[];
  onClose: () => void;
  icon?: React.ComponentProps<typeof Feather>["name"];
}

export default function ConfirmDialog({ visible, title, message, actions, onClose, icon = "alert-triangle" }: Props) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, title]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          alignItems: "center",
          justifyContent: "center",
          opacity,
        }}
      >
        <Pressable className="absolute inset-0" onPress={onClose} />
        <Animated.View
          style={{
            width: "85%",
            maxWidth: 360,
            backgroundColor: "#1A1A1A",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#2A2A2A",
            overflow: "hidden",
            transform: [{ scale }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Header */}
          <View className="p-6 items-center">
            <View className="w-[52px] h-[52px] rounded-2xl bg-[rgba(239,68,68,0.12)] items-center justify-center mb-4">
              <Feather name={icon} size={24} color="#EF4444" />
            </View>
            <Text className="text-textPrimary text-lg font-inter-semibold text-center mb-2">
              {title}
            </Text>
            <Text className="text-textMuted text-sm font-inter-regular text-center leading-5">
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-border w-full">
            {actions.map((action, i) => {
              const isDestructive = action.style === "destructive";
              const isCancel = action.style === "cancel";
              return (
                <View
                  key={i}
                  className="flex-1"
                  style={i > 0 ? { borderLeftWidth: 1, borderLeftColor: "#2A2A2A" } : undefined}
                >
                  <Pressable
                    onPress={() => {
                      if (isCancel) {
                        onClose();
                      } else {
                        action.onPress?.();
                      }
                    }}
                    className="py-4 items-center justify-center active:scale-[0.98]"
                  >
                    <Text
                      className={`text-[15px] ${isCancel ? "font-inter-regular" : "font-inter-semibold"}`}
                      style={{ color: isDestructive ? "#EF4444" : isCancel ? "#888" : "#3B82F6" }}
                    >
                      {action.text}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
