import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Maquina } from "../types/maquina";

interface Props {
  visible: boolean;
  maquinas: Maquina[];
  onClose: () => void;
  onSubmit: (data: {
    maquina_id: string;
    fecha_realizacion: string;
    tecnico_responsable: string;
    descripcion: string;
    fotos_uris: string[];
    costo_total: number;
    tipo: string;
  }) => Promise<void>;
}

const tipoOptions = [
  { value: "preventivo", label: "Preventivo", icon: "shield", color: "#3B82F6" },
  { value: "correctivo", label: "Correctivo", icon: "tool", color: "#F59E0B" },
];

export default function AddMantenimientoModal({
  visible,
  maquinas,
  onClose,
  onSubmit,
}: Props) {
  const [maquinaId, setMaquinaId] = useState("");
  const [showMaquinaMenu, setShowMaquinaMenu] = useState(false);
  const [fechaRealizacion, setFechaRealizacion] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tecnico, setTecnico] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotosUris, setFotosUris] = useState<string[]>([]);
  const [costoTotal, setCostoTotal] = useState("");
  const [tipo, setTipo] = useState("preventivo");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const tecnicoRef = useRef<TextInput>(null);
  const descripcionRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setMaquinaId("");
      setFechaRealizacion(new Date());
      setTecnico("");
      setDescripcion("");
      setFotosUris([]);
      setCostoTotal("");
      setTipo("preventivo");
      setShowMaquinaMenu(false);
      setShowDatePicker(false);
    }
  }, [visible]);

  const pickImage = async () => {
    if (fotosUris.length >= 3) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFotosUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setFotosUris((prev) => prev.filter((_, i) => i !== index));
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setFechaRealizacion(selectedDate);
  };

  const selectedMaquina = maquinas.find((m) => m.id === maquinaId);

  const canSubmit = maquinaId && tecnico.trim() && descripcion.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onSubmit({
        maquina_id: maquinaId,
        fecha_realizacion: fechaRealizacion.toISOString(),
        tecnico_responsable: tecnico.trim(),
        descripcion: descripcion.trim(),
        fotos_uris: fotosUris,
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
            Nuevo Mantenimiento
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo — pill selector */}
          <Text style={labelStyle}>Tipo de Mantenimiento *</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 24,
            }}
          >
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
                    backgroundColor: isSelected
                      ? `${opt.color}15`
                      : "#1E1E1E",
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
                      fontFamily: isSelected
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Máquina selector */}
          <Text style={labelStyle}>Máquina *</Text>
          <Pressable
            onPress={() => setShowMaquinaMenu(!showMaquinaMenu)}
            style={{
              backgroundColor: "#1E1E1E",
              borderWidth: 1,
              borderColor: showMaquinaMenu ? "#3B82F6" : "#2A2A2A",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: showMaquinaMenu ? 6 : 20,
            }}
          >
            <Text
              style={{
                color: selectedMaquina ? "#F5F5F5" : "#555",
                fontSize: 16,
                fontFamily: "Inter_400Regular",
              }}
            >
              {selectedMaquina?.nombre || "Seleccionar máquina"}
            </Text>
            <Feather
              name={showMaquinaMenu ? "chevron-up" : "chevron-down"}
              size={18}
              color="#A0A0A0"
            />
          </Pressable>
          {showMaquinaMenu && (
            <View
              style={{
                backgroundColor: "#1E1E1E",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 12,
                marginBottom: 20,
                maxHeight: 200,
                overflow: "hidden",
              }}
            >
              <ScrollView nestedScrollEnabled>
                {maquinas.map((m, idx) => {
                  const isSelected = maquinaId === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => {
                        setMaquinaId(m.id);
                        setShowMaquinaMenu(false);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: isSelected
                          ? "rgba(59,130,246,0.08)"
                          : "transparent",
                        borderTopWidth: idx > 0 ? 1 : 0,
                        borderTopColor: "#2A2A2A",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Feather
                          name="settings"
                          size={14}
                          color={isSelected ? "#3B82F6" : "#555"}
                        />
                        <Text
                          style={{
                            color: isSelected ? "#60A5FA" : "#A0A0A0",
                            fontSize: 15,
                            fontFamily: isSelected
                              ? "Inter_500Medium"
                              : "Inter_400Regular",
                          }}
                        >
                          {m.nombre}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={16} color="#60A5FA" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Fecha */}
          <Text style={labelStyle}>Fecha de Realización *</Text>
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
              {fechaRealizacion.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <View style={{ marginBottom: 20, marginTop: -12 }}>
              <DateTimePicker
                value={fechaRealizacion}
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
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    Confirmar
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Técnico */}
          <Text style={labelStyle}>Técnico Responsable *</Text>
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
          <Text style={labelStyle}>Descripción *</Text>
          <TextInput
            ref={descripcionRef}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción del trabajo realizado"
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

          {/* Fotos del trabajo (hasta 3) */}
          <Text style={labelStyle}>Fotos del Trabajo (máx. 3)</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 32,
              flexWrap: "wrap",
            }}
          >
            {fotosUris.map((uri, index) => (
              <View
                key={index}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Image
                  source={{ uri }}
                  style={{ width: 100, height: 100 }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => removePhoto(index)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={14} color="#FFF" />
                </Pressable>
              </View>
            ))}

            {fotosUris.length < 3 && (
              <Pressable
                onPress={pickImage}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: "#2A2A2A",
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#1A1A1A",
                }}
              >
                <Feather name="camera" size={22} color="#555" />
                <Text
                  style={{
                    color: "#555",
                    fontSize: 10,
                    fontFamily: "Inter_500Medium",
                    marginTop: 4,
                  }}
                >
                  {fotosUris.length}/3
                </Text>
              </Pressable>
            )}
          </View>

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
                Guardar Mantenimiento
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
