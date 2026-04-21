import { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, Modal, Pressable, Animated, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void>;
}

export default function DeletePasswordModal({ visible, onClose, onSubmit }: Props) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const inputRef0 = useRef<TextInput>(null);
  const inputRef1 = useRef<TextInput>(null);
  const inputRef2 = useRef<TextInput>(null);
  const inputRef3 = useRef<TextInput>(null);
  const inputRefs = [inputRef0, inputRef1, inputRef2, inputRef3];

  useEffect(() => {
    if (visible) {
      setDigits(["", "", "", ""]);
      setError("");
      setLoading(false);
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setTimeout(() => inputRef0.current?.focus(), 150);
    }
  }, [visible]);

  const submit = async (pin: string) => {
    setLoading(true);
    setError("");
    try {
      await onSubmit(pin);
    } catch (err: any) {
      if (err?.status === 401) {
        setError("Contraseña incorrecta");
        setDigits(["", "", "", ""]);
        setTimeout(() => inputRef0.current?.focus(), 50);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");

    if (digit) {
      if (index < 3) {
        inputRefs[index + 1].current?.focus();
      } else {
        submit(newDigits.join(""));
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs[index - 1].current?.focus();
    }
  };

  if (!visible) return null;

  const hasError = !!error;

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
            maxWidth: 340,
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
              <Feather name="lock" size={24} color="#EF4444" />
            </View>
            <Text style={{ color: "#F5F5F5", fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 4 }}>
              Confirmar eliminación
            </Text>
            <Text style={{ color: "#888", fontSize: 14, textAlign: "center" }}>
              Ingresa la contraseña de 4 dígitos
            </Text>
          </View>

          {/* PIN inputs */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, paddingHorizontal: 24, marginBottom: 8 }}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={inputRefs[i]}
                value={digit}
                onChangeText={(v) => handleChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={2}
                secureTextEntry
                editable={!loading}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  textAlign: "center",
                  color: "#F5F5F5",
                  fontSize: 24,
                  fontWeight: "600",
                  backgroundColor: "#242424",
                  borderWidth: 1.5,
                  borderColor: hasError ? "#EF4444" : digit ? "#3B82F6" : "#333",
                }}
              />
            ))}
          </View>

          {/* Error or spacer */}
          <View style={{ height: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            {hasError && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="alert-circle" size={13} color="#EF4444" />
                <Text style={{ color: "#EF4444", fontSize: 13 }}>{error}</Text>
              </View>
            )}
          </View>

          {/* Cancel */}
          <View style={{ borderTopWidth: 1, borderTopColor: "#2A2A2A" }}>
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center" }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={{ color: "#888", fontSize: 15 }}>Cancelar</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
