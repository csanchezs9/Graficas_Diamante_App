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
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DatePicker from "./DatePicker";
import { Mantenimiento } from "../types/mantenimiento";
import { formatCurrency, parseCurrency } from "../utils/currency";
import { parseDate, toLocalISOString } from "../utils/date";

interface Props {
  visible: boolean;
  mantenimientos: Mantenimiento[];
  onClose: () => void;
  onSubmit: (data: {
    mantenimiento_id: string | null;
    nombre: string;
    codigo: string;
    tipo: string;
    cantidad_disponible: number;
    costo_unitario: number;
    proveedor: string;
    fecha: string;
    imagen_uri: string | null;
  }) => Promise<void>;
}

const tipoOptions = [
  { value: "mecanico", label: "Mecanico", icon: "settings", color: "#3B82F6" },
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
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("mecanico");
  const [cantidad, setCantidad] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nombreRef = useRef<TextInput>(null);
  const codigoRef = useRef<TextInput>(null);
  const cantidadRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);
  const proveedorRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setMantenimientoId("");
      setMantSearch("");
      setNombre("");
      setCodigo("");
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
    if (selectedDate) {
      setFecha(new Date(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate()));
    }
  };

  const selectedMant = mantenimientos.find((m) => m.id === mantenimientoId);

  const canSubmit = nombre.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onSubmit({
        mantenimiento_id: mantenimientoId || null,
        nombre: nombre.trim(),
        codigo: codigo.trim(),
        tipo,
        cantidad_disponible: Math.max(0, parseInt(cantidad) || 0),
        costo_unitario: Math.max(0, parseCurrency(costoUnitario)),
        proveedor: proveedor.trim(),
        fecha: toLocalISOString(fecha),
        imagen_uri: imagenUri,
      });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-surface border-b border-border">
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar formulario"
            className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center active:scale-[0.98]"
          >
            <Feather name="x" size={20} color="#A0A0A0" />
          </Pressable>
          <Text className="text-textPrimary text-lg font-inter-semibold">
            Nuevo Repuesto
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo — pill selector */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Tipo de Repuesto *
          </Text>
          <View className="flex-row gap-2 mb-6 flex-wrap">
            {tipoOptions.map((opt) => {
              const isSelected = tipo === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTipo(opt.value)}
                  className={`flex-row items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border-[1.5px] active:scale-[0.98] ${
                    isSelected ? "" : "border-border bg-surfaceLight"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: opt.color, backgroundColor: `${opt.color}15` }
                      : undefined
                  }
                >
                  <Feather
                    name={opt.icon as any}
                    size={14}
                    color={isSelected ? opt.color : "#666"}
                  />
                  <Text
                    className={`text-[13px] ${
                      isSelected ? "font-inter-semibold" : "font-inter-regular"
                    }`}
                    style={{ color: isSelected ? opt.color : "#666" }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Mantenimiento selector con busqueda */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Mantenimiento Asociado
          </Text>
          {selectedMant && !showMantMenu ? (
            <Pressable
              onPress={() => {
                setMantenimientoId("");
                setMantSearch("");
                setShowMantMenu(true);
              }}
              className="bg-surfaceLight border border-accent rounded-2xl px-4 py-3.5 flex-row items-center justify-between mb-5 active:scale-[0.98]"
            >
              <View className="flex-1 mr-2.5">
                <Text
                  className="text-textPrimary text-[15px] font-inter-medium"
                  numberOfLines={1}
                >
                  {selectedMant.maquinas?.nombre || "—"}
                </Text>
                <Text
                  className="text-[#666] text-xs font-inter-regular mt-0.5"
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
                className={`bg-surfaceLight border rounded-2xl px-4 flex-row items-center ${
                  showMantMenu ? "border-accent mb-1.5" : "border-border mb-5"
                }`}
              >
                <Feather name="search" size={16} color="#666" />
                <TextInput
                  value={mantSearch}
                  onChangeText={(text) => {
                    setMantSearch(text);
                    if (!showMantMenu) setShowMantMenu(true);
                  }}
                  onFocus={() => setShowMantMenu(true)}
                  placeholder="Buscar por maquina o descripcion..."
                  placeholderTextColor="#555"
                  className="flex-1 text-textPrimary text-base font-inter-regular py-3.5 px-2.5"
                />
                {mantSearch.length > 0 && (
                  <Pressable onPress={() => setMantSearch("")}>
                    <Feather name="x" size={16} color="#666" />
                  </Pressable>
                )}
              </View>
              {showMantMenu && (
                <View className="bg-surfaceLight border border-border rounded-xl mb-5 max-h-[220px] overflow-hidden">
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
                          <View className="px-4 py-5 items-center">
                            <Feather name="search" size={20} color="#444" />
                            <Text className="text-[#555] text-[13px] font-inter-regular mt-1.5">
                              No se encontraron mantenimientos
                            </Text>
                          </View>
                        );
                      }

                      return filtered.map((m, idx) => {
                        const machineName = m.maquinas?.nombre || "—";
                        const fechaStr = (parseDate(m.fecha_realizacion) ?? new Date()).toLocaleDateString("es-CO", {
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
                            className="px-4 py-3.5"
                            style={{
                              borderTopWidth: idx > 0 ? 1 : 0,
                              borderTopColor: "#2A2A2A",
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <Text
                                className="text-[#E0E0E0] text-sm font-inter-medium flex-1"
                                numberOfLines={1}
                              >
                                {machineName}
                              </Text>
                              <Text className="text-[#555] text-[11px] font-inter-regular ml-2">
                                {fechaStr}
                              </Text>
                            </View>
                            <Text
                              className="text-[#666] text-xs font-inter-regular mt-0.5"
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
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Nombre *
          </Text>
          <TextInput
            ref={nombreRef}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre del repuesto"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => codigoRef.current?.focus()}
            blurOnSubmit={false}
            maxLength={100}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Codigo */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Código
          </Text>
          <TextInput
            ref={codigoRef}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="Código de referencia"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => cantidadRef.current?.focus()}
            blurOnSubmit={false}
            maxLength={60}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Cantidad */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Cantidad Disponible
          </Text>
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
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Costo Unitario */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Costo Unitario
          </Text>
          <TextInput
            ref={costoRef}
            value={costoUnitario}
            onChangeText={(text) => setCostoUnitario(formatCurrency(text))}
            placeholder="0"
            placeholderTextColor="#555"
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => proveedorRef.current?.focus()}
            blurOnSubmit={false}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Proveedor */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Proveedor
          </Text>
          <TextInput
            ref={proveedorRef}
            value={proveedor}
            onChangeText={setProveedor}
            placeholder="Nombre del proveedor"
            placeholderTextColor="#555"
            returnKeyType="done"
            maxLength={100}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Fecha */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fecha
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5 mb-5 active:scale-[0.98]"
          >
            <Feather name="calendar" size={18} color="#3B82F6" />
            <Text className="text-textPrimary text-base font-inter-regular">
              {fecha.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <View className="mb-5 -mt-3">
              <DatePicker
                value={fecha}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  className="self-center bg-accent px-6 py-2.5 rounded-xl mt-2 active:scale-[0.98]"
                >
                  <Text className="text-white text-sm font-inter-medium">
                    Confirmar
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Imagen */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Imagen del Repuesto
          </Text>
          <View className="mb-8">
            {imagenUri ? (
              <View className="w-[120px] h-[120px] rounded-xl overflow-hidden relative">
                <Image
                  source={{ uri: imagenUri }}
                  className="w-[120px] h-[120px]"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setImagenUri(null)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center active:scale-[0.98]"
                >
                  <Feather name="x" size={14} color="#FFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                className="w-[120px] h-[120px] rounded-xl border-[1.5px] border-dashed border-border items-center justify-center bg-[#1A1A1A] active:scale-[0.98]"
              >
                <Feather name="camera" size={22} color="#555" />
                <Text className="text-[#555] text-[10px] font-inter-medium mt-1">
                  Agregar
                </Text>
              </Pressable>
            )}
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
            className={`${
              canSubmit ? "bg-accent" : "bg-surfaceLight"
            } py-4 rounded-2xl items-center ${
              loading ? "opacity-70" : ""
            } active:scale-[0.98]`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`${
                  canSubmit ? "text-white" : "text-textMuted"
                } text-base font-inter-semibold`}
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
