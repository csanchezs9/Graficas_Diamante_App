import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Mantenimiento } from "../types/mantenimiento";

interface Props {
  visible: boolean;
  mantenimiento: Mantenimiento;
  onClose: () => void;
  onSubmit: (data: {
    fecha_realizacion: string;
    tecnico_responsable: string;
    descripcion: string;
    costo_total: number;
    tipo: string;
  }) => Promise<void>;
}

const tipoOptions = [
  { value: "preventivo", label: "Preventivo", icon: "shield", color: "#3B82F6" },
  { value: "correctivo", label: "Correctivo", icon: "tool", color: "#F59E0B" },
];

export default function EditMantenimientoModal({
  visible,
  mantenimiento,
  onClose,
  onSubmit,
}: Props) {
  const [fecha, setFecha] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tecnico, setTecnico] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costoTotal, setCostoTotal] = useState("");
  const [tipo, setTipo] = useState("preventivo");
  const [loading, setLoading] = useState(false);

  const tecnicoRef = useRef<TextInput>(null);
  const descripcionRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && mantenimiento) {
      setFecha(new Date(mantenimiento.fecha_realizacion));
      setTecnico(mantenimiento.tecnico_responsable);
      setDescripcion(mantenimiento.descripcion);
      setCostoTotal(
        mantenimiento.costo_total > 0
          ? String(mantenimiento.costo_total)
          : ""
      );
      setTipo(mantenimiento.tipo);
      setShowDatePicker(false);
    }
  }, [visible, mantenimiento]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const canSubmit = tecnico.trim() && descripcion.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onSubmit({
        fecha_realizacion: fecha.toISOString(),
        tecnico_responsable: tecnico.trim(),
        descripcion: descripcion.trim(),
        costo_total: parseFloat(costoTotal) || 0,
        tipo,
      });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    color: "#A0A0A0",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
  };

  const inputStyle = {
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
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        {/* Header */}
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
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#1E1E1E",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="x" size={20} color="#A0A0A0" />
          </Pressable>
          <Text
            style={{
              color: "#F5F5F5",
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Editar Mantenimiento
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo */}
          <Text style={labelStyle}>Tipo de Mantenimiento</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            {tipoOptions.map((opt) => {
              const isSelected = tipo === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTipo(opt.value)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isSelected ? opt.color : "#2A2A2A",
                    backgroundColor: isSelected ? `${opt.color}15` : "#1E1E1E",
                  }}
                >
                  <Feather
                    name={opt.icon as any}
                    size={16}
                    color={isSelected ? opt.color : "#666"}
                  />
                  <Text
                    style={{
                      color: isSelected ? opt.color : "#666",
                      fontSize: 14,
                      fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Fecha */}
          <Text style={labelStyle}>Fecha de Realización</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{
              ...inputStyle,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Feather name="calendar" size={18} color="#3B82F6" />
            <Text
              style={{
                color: "#F5F5F5",
                fontSize: 16,
                fontFamily: "Inter_400Regular",
              }}
            >
              {fecha.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <View style={{ marginBottom: 20, marginTop: -12 }}>
              <DateTimePicker
                value={fecha}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                themeVariant="dark"
              />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={{
                    alignSelf: "center",
                    backgroundColor: "#3B82F6",
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#FFF", fontSize: 14, fontFamily: "Inter_500Medium" }}>
                    Confirmar
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Técnico */}
          <Text style={labelStyle}>Técnico Responsable</Text>
          <TextInput
            ref={tecnicoRef}
            value={tecnico}
            onChangeText={setTecnico}
            placeholder="Nombre del técnico"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => descripcionRef.current?.focus()}
            blurOnSubmit={false}
            style={inputStyle}
          />

          {/* Descripción */}
          <Text style={labelStyle}>Descripción</Text>
          <TextInput
            ref={descripcionRef}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción del trabajo"
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
            returnKeyType="next"
            blurOnSubmit
            onSubmitEditing={() => costoRef.current?.focus()}
            style={{
              ...inputStyle,
              minHeight: 90,
              textAlignVertical: "top",
            }}
          />

          {/* Costo */}
          <Text style={labelStyle}>Costo Total</Text>
          <TextInput
            ref={costoRef}
            value={costoTotal}
            onChangeText={setCostoTotal}
            placeholder="0"
            placeholderTextColor="#555"
            keyboardType="numeric"
            returnKeyType="done"
            style={inputStyle}
          />

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
            style={{
              backgroundColor: canSubmit ? "#3B82F6" : "#1E1E1E",
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
                  color: canSubmit ? "#FFFFFF" : "#666",
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Guardar Cambios
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
