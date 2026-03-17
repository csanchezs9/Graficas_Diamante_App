import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    descripcion: string;
    codigo: string;
    ubicacion: string;
    estado: string;
  }) => Promise<void>;
}

const estados = ["Activa", "Inactiva", "Mantenimiento"];

export default function AddMaquinaModal({ visible, onClose, onSubmit }: Props) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [estado, setEstado] = useState("Activa");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const descripcionRef = useRef<TextInput>(null);
  const codigoRef = useRef<TextInput>(null);
  const ubicacionRef = useRef<TextInput>(null);

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setCodigo("");
    setUbicacion("");
    setEstado("Activa");
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        codigo: codigo.trim(),
        ubicacion: ubicacion.trim(),
        estado: estado.toLowerCase(),
      });
      resetForm();
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        {/* Header fijo */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 48,
            paddingBottom: 16,
            backgroundColor: "#141414",
            borderBottomWidth: 1,
            borderBottomColor: "#2A2A2A",
          }}
        >
          <Pressable
            onPress={() => {
              resetForm();
              onClose();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#1E1E1E",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="arrow-left" size={20} color="#A0A0A0" />
          </Pressable>
          <Text
            style={{
              color: "#F5F5F5",
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Nueva Máquina
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form scrollable */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nombre */}
          <Text
            style={{
              color: "#A0A0A0",
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Nombre *
          </Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Prensa Offset 4C"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => descripcionRef.current?.focus()}
            blurOnSubmit={false}
            style={{
              backgroundColor: "#1E1E1E",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: "#F5F5F5",
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              marginBottom: 20,
            }}
          />

          {/* Descripcion */}
          <Text
            style={{
              color: "#A0A0A0",
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Descripción
          </Text>
          <TextInput
            ref={descripcionRef}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción de la máquina"
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
            returnKeyType="next"
            blurOnSubmit={true}
            onSubmitEditing={() => codigoRef.current?.focus()}
            style={{
              backgroundColor: "#1E1E1E",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: "#F5F5F5",
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              minHeight: 90,
              textAlignVertical: "top",
              marginBottom: 20,
            }}
          />

          {/* Codigo */}
          <Text
            style={{
              color: "#A0A0A0",
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Código
          </Text>
          <TextInput
            ref={codigoRef}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="MQ-001"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => ubicacionRef.current?.focus()}
            blurOnSubmit={false}
            style={{
              backgroundColor: "#1E1E1E",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: "#F5F5F5",
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              marginBottom: 20,
            }}
          />

          {/* Ubicacion */}
          <Text
            style={{
              color: "#A0A0A0",
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Ubicación
          </Text>
          <TextInput
            ref={ubicacionRef}
            value={ubicacion}
            onChangeText={setUbicacion}
            placeholder="Planta 1"
            placeholderTextColor="#555"
            returnKeyType="done"
            style={{
              backgroundColor: "#1E1E1E",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: "#F5F5F5",
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              marginBottom: 24,
            }}
          />

          {/* Estado */}
          <Text
            style={{
              color: "#A0A0A0",
              fontSize: 12,
              fontFamily: "Inter_500Medium",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            Estado
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
            {estados.map((e) => {
              const selected = estado === e;
              return (
                <Pressable
                  key={e}
                  onPress={() => setEstado(e)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected ? "#3B82F6" : "#2A2A2A",
                    backgroundColor: selected ? "rgba(59,130,246,0.1)" : "#1E1E1E",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Inter_500Medium",
                      color: selected ? "#60A5FA" : "#A0A0A0",
                    }}
                  >
                    {e}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !nombre.trim()}
            style={{
              backgroundColor: nombre.trim() ? "#3B82F6" : "#1E1E1E",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  color: nombre.trim() ? "#FFFFFF" : "#666",
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Crear Máquina
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
