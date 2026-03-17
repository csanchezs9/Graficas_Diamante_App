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
import { Repuesto } from "../types/repuesto";

interface Props {
  visible: boolean;
  repuesto: Repuesto;
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    tipo: string;
    cantidad_disponible: number;
    costo_unitario: number;
    proveedor: string;
    fecha: string;
  }) => Promise<void>;
}

const tipoOptions = [
  { value: "mecanico", label: "Mecánico", icon: "settings", color: "#3B82F6" },
  { value: "consumible", label: "Consumible", icon: "box", color: "#F59E0B" },
];

export default function EditRepuestoModal({
  visible,
  repuesto,
  onClose,
  onSubmit,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("mecanico");
  const [cantidad, setCantidad] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const nombreRef = useRef<TextInput>(null);
  const cantidadRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);
  const proveedorRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && repuesto) {
      setNombre(repuesto.nombre);
      setTipo(repuesto.tipo);
      setCantidad(
        repuesto.cantidad_disponible > 0
          ? String(repuesto.cantidad_disponible)
          : ""
      );
      setCostoUnitario(
        repuesto.costo_unitario > 0
          ? String(repuesto.costo_unitario)
          : ""
      );
      setProveedor(repuesto.proveedor || "");
      setFecha(repuesto.fecha ? new Date(repuesto.fecha) : new Date());
      setShowDatePicker(false);
    }
  }, [visible, repuesto]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const canSubmit = nombre.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        tipo,
        cantidad_disponible: parseInt(cantidad) || 0,
        costo_unitario: parseFloat(costoUnitario) || 0,
        proveedor: proveedor.trim(),
        fecha: fecha.toISOString(),
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
            Editar Repuesto
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
          <Text style={labelStyle}>Tipo de Repuesto</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {tipoOptions.map((opt) => {
              const isSelected = tipo === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTipo(opt.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isSelected ? opt.color : "#2A2A2A",
                    backgroundColor: isSelected ? `${opt.color}15` : "#1E1E1E",
                  }}
                >
                  <Feather
                    name={opt.icon as any}
                    size={14}
                    color={isSelected ? opt.color : "#666"}
                  />
                  <Text
                    style={{
                      color: isSelected ? opt.color : "#666",
                      fontSize: 13,
                      fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Nombre */}
          <Text style={labelStyle}>Nombre</Text>
          <TextInput
            ref={nombreRef}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre del repuesto"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => cantidadRef.current?.focus()}
            blurOnSubmit={false}
            style={inputStyle}
          />

          {/* Cantidad */}
          <Text style={labelStyle}>Cantidad Disponible</Text>
          <TextInput
            ref={cantidadRef}
            value={cantidad}
            onChangeText={setCantidad}
            placeholder="0"
            placeholderTextColor="#555"
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => costoRef.current?.focus()}
            blurOnSubmit={false}
            style={inputStyle}
          />

          {/* Costo Unitario */}
          <Text style={labelStyle}>Costo Unitario</Text>
          <TextInput
            ref={costoRef}
            value={costoUnitario}
            onChangeText={setCostoUnitario}
            placeholder="0"
            placeholderTextColor="#555"
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => proveedorRef.current?.focus()}
            blurOnSubmit={false}
            style={inputStyle}
          />

          {/* Proveedor */}
          <Text style={labelStyle}>Proveedor</Text>
          <TextInput
            ref={proveedorRef}
            value={proveedor}
            onChangeText={setProveedor}
            placeholder="Nombre del proveedor"
            placeholderTextColor="#555"
            returnKeyType="done"
            style={inputStyle}
          />

          {/* Fecha */}
          <Text style={labelStyle}>Fecha</Text>
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
              marginTop: 12,
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
