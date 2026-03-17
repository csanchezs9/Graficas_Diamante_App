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
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
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
          <View style={{ padding: 24, alignItems: "center" }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(239,68,68,0.12)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Feather name={icon} size={24} color="#EF4444" />
            </View>
            <Text
              style={{
                color: "#F5F5F5",
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: "#999",
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: "#2A2A2A",
              width: "100%",
            }}
          >
            {actions.map((action, i) => {
              const isDestructive = action.style === "destructive";
              const isCancel = action.style === "cancel";
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    borderLeftWidth: i > 0 ? 1 : 0,
                    borderLeftColor: "#2A2A2A",
                  }}
                >
                  <Pressable
                    onPress={() => {
                      if (isCancel) {
                        onClose();
                      } else {
                        action.onPress?.();
                      }
                    }}
                    style={{
                      paddingVertical: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: isCancel ? "Inter_400Regular" : "Inter_600SemiBold",
                        color: isDestructive ? "#EF4444" : isCancel ? "#888" : "#3B82F6",
                      }}
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
