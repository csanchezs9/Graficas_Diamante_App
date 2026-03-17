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
import { Mantenimiento } from "../types/mantenimiento";

interface Props {
  visible: boolean;
  mantenimientos: Mantenimiento[];
  onClose: () => void;
  onSubmit: (data: {
    mantenimiento_id: string;
    nombre: string;
    tipo: string;
    cantidad_disponible: number;
    costo_unitario: number;
    proveedor: string;
    fecha: string;
    imagen_uri: string | null;
  }) => Promise<void>;
}

const tipoOptions = [
  { value: "mecanico", label: "Mecánico", icon: "settings", color: "#3B82F6" },
  { value: "consumible", label: "Consumible", icon: "box", color: "#F59E0B" },
];

export default function AddRepuestoModal({
  visible,
  mantenimientos,
  onClose,
  onSubmit,
}: Props) {
  const [mantenimientoId, setMantenimientoId] = useState("");
  const [mantSearch, setMantSearch] = useState("");
  const [showMantMenu, setShowMantMenu] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("mecanico");
  const [cantidad, setCantidad] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nombreRef = useRef<TextInput>(null);
  const cantidadRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);
  const proveedorRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setMantenimientoId("");
      setMantSearch("");
      setNombre("");
      setTipo("mecanico");
      setCantidad("");
      setCostoUnitario("");
      setProveedor("");
      setFecha(new Date());
      setImagenUri(null);
      setShowMantMenu(false);
      setShowDatePicker(false);
    }
  }, [visible]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImagenUri(result.assets[0].uri);
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const selectedMant = mantenimientos.find((m) => m.id === mantenimientoId);

  const canSubmit = mantenimientoId && nombre.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onSubmit({
        mantenimiento_id: mantenimientoId,
        nombre: nombre.trim(),
        tipo,
        cantidad_disponible: parseInt(cantidad) || 0,
        costo_unitario: parseFloat(costoUnitario) || 0,
        proveedor: proveedor.trim(),
        fecha: fecha.toISOString(),
        imagen_uri: imagenUri,
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
            Nuevo Repuesto
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo — pill selector */}
          <Text style={labelStyle}>Tipo de Repuesto *</Text>
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
                    backgroundColor: isSelected
                      ? `${opt.color}15`
                      : "#1E1E1E",
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

          {/* Mantenimiento selector con búsqueda */}
          <Text style={labelStyle}>Mantenimiento Asociado *</Text>
          {selectedMant && !showMantMenu ? (
            <Pressable
              onPress={() => {
                setMantenimientoId("");
                setMantSearch("");
                setShowMantMenu(true);
              }}
              style={{
                backgroundColor: "#1E1E1E",
                borderWidth: 1,
                borderColor: "#3B82F6",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text
                  style={{
                    color: "#F5F5F5",
                    fontSize: 15,
                    fontFamily: "Inter_500Medium",
                  }}
                  numberOfLines={1}
                >
                  {selectedMant.maquinas?.nombre || "—"}
                </Text>
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {selectedMant.descripcion}
                </Text>
              </View>
              <Feather name="x-circle" size={18} color="#A0A0A0" />
            </Pressable>
          ) : (
            <>
              <View
                style={{
                  backgroundColor: "#1E1E1E",
                  borderWidth: 1,
                  borderColor: showMantMenu ? "#3B82F6" : "#2A2A2A",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: showMantMenu ? 6 : 20,
                }}
              >
                <Feather name="search" size={16} color="#666" />
                <TextInput
                  value={mantSearch}
                  onChangeText={(text) => {
                    setMantSearch(text);
                    if (!showMantMenu) setShowMantMenu(true);
                  }}
                  onFocus={() => setShowMantMenu(true)}
                  placeholder="Buscar por máquina o descripción..."
                  placeholderTextColor="#555"
                  style={{
                    flex: 1,
                    color: "#F5F5F5",
                    fontSize: 16,
                    fontFamily: "Inter_400Regular",
                    paddingVertical: 14,
                    paddingHorizontal: 10,
                  }}
                />
                {mantSearch.length > 0 && (
                  <Pressable onPress={() => setMantSearch("")}>
                    <Feather name="x" size={16} color="#666" />
                  </Pressable>
                )}
              </View>
              {showMantMenu && (
                <View
                  style={{
                    backgroundColor: "#1E1E1E",
                    borderWidth: 1,
                    borderColor: "#2A2A2A",
                    borderRadius: 12,
                    marginBottom: 20,
                    maxHeight: 220,
                    overflow: "hidden",
                  }}
                >
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {(() => {
                      const query = mantSearch.toLowerCase().trim();
                      const filtered = mantenimientos.filter((m) => {
                        if (!query) return true;
                        const machineName = (m.maquinas?.nombre || "").toLowerCase();
                        const desc = (m.descripcion || "").toLowerCase();
                        const tecnico = (m.tecnico_responsable || "").toLowerCase();
                        return (
                          machineName.includes(query) ||
                          desc.includes(query) ||
                          tecnico.includes(query)
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <View
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 20,
                              alignItems: "center",
                            }}
                          >
                            <Feather name="search" size={20} color="#444" />
                            <Text
                              style={{
                                color: "#555",
                                fontSize: 13,
                                fontFamily: "Inter_400Regular",
                                marginTop: 6,
                              }}
                            >
                              No se encontraron mantenimientos
                            </Text>
                          </View>
                        );
                      }

                      return filtered.map((m, idx) => {
                        const machineName = m.maquinas?.nombre || "—";
                        const fechaStr = new Date(m.fecha_realizacion).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        return (
                          <Pressable
                            key={m.id}
                            onPress={() => {
                              setMantenimientoId(m.id);
                              setMantSearch("");
                              setShowMantMenu(false);
                            }}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 13,
                              backgroundColor: "transparent",
                              borderTopWidth: idx > 0 ? 1 : 0,
                              borderTopColor: "#2A2A2A",
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                              <Text
                                style={{
                                  color: "#E0E0E0",
                                  fontSize: 14,
                                  fontFamily: "Inter_500Medium",
                                  flex: 1,
                                }}
                                numberOfLines={1}
                              >
                                {machineName}
                              </Text>
                              <Text
                                style={{
                                  color: "#555",
                                  fontSize: 11,
                                  fontFamily: "Inter_400Regular",
                                  marginLeft: 8,
                                }}
                              >
                                {fechaStr}
                              </Text>
                            </View>
                            <Text
                              style={{
                                color: "#666",
                                fontSize: 12,
                                fontFamily: "Inter_400Regular",
                                marginTop: 3,
                              }}
                              numberOfLines={1}
                            >
                              {m.descripcion}
                            </Text>
                          </Pressable>
                        );
                      });
                    })()}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* Nombre */}
          <Text style={labelStyle}>Nombre *</Text>
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

          {/* Imagen */}
          <Text style={labelStyle}>Imagen del Repuesto</Text>
          <View style={{ marginBottom: 32 }}>
            {imagenUri ? (
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Image
                  source={{ uri: imagenUri }}
                  style={{ width: 120, height: 120 }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setImagenUri(null)}
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
            ) : (
              <Pressable
                onPress={pickImage}
                style={{
                  width: 120,
                  height: 120,
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
                  Agregar
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
                Guardar Repuesto
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
