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
import { Maquina } from "../types/maquina";
import { Repuesto } from "../types/repuesto";
import { api } from "../services/api";
import { formatCurrency, parseCurrency } from "../utils/currency";

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
    selected_repuesto_ids: string[];
  }) => Promise<void>;
  defaultMaquinaId?: string;
}

const tipoOptions = [
  { value: "preventivo", label: "Preventivo", icon: "shield", color: "#3B82F6" },
  { value: "correctivo", label: "Correctivo", icon: "tool", color: "#F59E0B" },
];

const repuestoTipoConfig: Record<string, { color: string; bg: string }> = {
  mecanico: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  consumible: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
};

export default function AddMantenimientoModal({
  visible,
  maquinas,
  onClose,
  onSubmit,
  defaultMaquinaId,
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

  // Repuestos selector
  const [allRepuestos, setAllRepuestos] = useState<Repuesto[]>([]);
  const [loadingRepuestos, setLoadingRepuestos] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [repuestoSearch, setRepuestoSearch] = useState("");
  const [showRepuestoList, setShowRepuestoList] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const tecnicoRef = useRef<TextInput>(null);
  const descripcionRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setMaquinaId(defaultMaquinaId ?? "");
      setFechaRealizacion(new Date());
      setTecnico("");
      setDescripcion("");
      setFotosUris([]);
      setCostoTotal("");
      setTipo("preventivo");
      setShowMaquinaMenu(false);
      setShowDatePicker(false);
      setSelectedIds([]);
      setRepuestoSearch("");
      setShowRepuestoList(false);
      fetchRepuestos();
    }
  }, [visible]);

  const fetchRepuestos = async () => {
    setLoadingRepuestos(true);
    try {
      const data = await api.getRepuestos();
      setAllRepuestos(data);
    } catch {
      // non-critical
    } finally {
      setLoadingRepuestos(false);
    }
  };

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

  const toggleRepuesto = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredRepuestos = allRepuestos.filter((r) => {
    const q = repuestoSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      r.nombre.toLowerCase().includes(q) ||
      (r.codigo || "").toLowerCase().includes(q) ||
      (r.proveedor || "").toLowerCase().includes(q)
    );
  });

  const selectedRepuestos = allRepuestos.filter((r) => selectedIds.includes(r.id));
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
        costo_total: parseCurrency(costoTotal),
        tipo,
        selected_repuesto_ids: selectedIds,
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
            Nuevo Mantenimiento
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Tipo de Mantenimiento *
          </Text>
          <View className="flex-row gap-2.5 mb-6">
            {tipoOptions.map((opt) => {
              const isSelected = tipo === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setTipo(opt.value)}
                  className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border-[1.5px] active:scale-[0.98] ${
                    isSelected ? "" : "border-border bg-surfaceLight"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: opt.color, backgroundColor: `${opt.color}15` }
                      : undefined
                  }
                >
                  <Feather name={opt.icon as any} size={16} color={isSelected ? opt.color : "#666"} />
                  <Text
                    className={`text-sm ${isSelected ? "font-inter-semibold" : "font-inter-regular"}`}
                    style={{ color: isSelected ? opt.color : "#666" }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Maquina */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Maquina *
          </Text>
          {defaultMaquinaId ? (
            <View className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-2.5">
                <Feather name="settings" size={14} color="#3B82F6" />
                <Text className="text-base font-inter-regular text-textPrimary">
                  {selectedMaquina?.nombre || "Máquina seleccionada"}
                </Text>
              </View>
              <Feather name="lock" size={14} color="#555" />
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setShowMaquinaMenu(!showMaquinaMenu)}
                className={`bg-surfaceLight border rounded-2xl px-4 py-3.5 flex-row items-center justify-between active:scale-[0.98] ${
                  showMaquinaMenu ? "border-accent mb-1.5" : "border-border mb-5"
                }`}
              >
                <Text className={`text-base font-inter-regular ${selectedMaquina ? "text-textPrimary" : "text-[#555]"}`}>
                  {selectedMaquina?.nombre || "Seleccionar maquina"}
                </Text>
                <Feather name={showMaquinaMenu ? "chevron-up" : "chevron-down"} size={18} color="#A0A0A0" />
              </Pressable>
              {showMaquinaMenu && (
                <View className="bg-surfaceLight border border-border rounded-xl mb-5 max-h-[200px] overflow-hidden">
                  <ScrollView nestedScrollEnabled>
                    {maquinas.map((m, idx) => {
                      const isSel = maquinaId === m.id;
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => { setMaquinaId(m.id); setShowMaquinaMenu(false); }}
                          className="px-4 py-3.5 flex-row items-center justify-between"
                          style={{
                            backgroundColor: isSel ? "rgba(59,130,246,0.08)" : "transparent",
                            borderTopWidth: idx > 0 ? 1 : 0,
                            borderTopColor: "#2A2A2A",
                          }}
                        >
                          <View className="flex-row items-center gap-2.5">
                            <Feather name="settings" size={14} color={isSel ? "#3B82F6" : "#555"} />
                            <Text className={`text-[15px] ${isSel ? "font-inter-medium text-[#60A5FA]" : "font-inter-regular text-textSecondary"}`}>
                              {m.nombre}
                            </Text>
                          </View>
                          {isSel && <Feather name="check" size={16} color="#60A5FA" />}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* Fecha */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fecha de Realizacion *
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5 mb-5 active:scale-[0.98]"
          >
            <Feather name="calendar" size={18} color="#3B82F6" />
            <Text className="text-textPrimary text-base font-inter-regular">
              {fechaRealizacion.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <View className="mb-5 -mt-3">
              <DatePicker value={fechaRealizacion} onChange={onDateChange} maximumDate={new Date()} />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  className="self-center bg-accent px-6 py-2.5 rounded-xl mt-2 active:scale-[0.98]"
                >
                  <Text className="text-white text-sm font-inter-medium">Confirmar</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Tecnico */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Tecnico Responsable *
          </Text>
          <TextInput
            ref={tecnicoRef}
            value={tecnico}
            onChangeText={setTecnico}
            placeholder="Nombre del tecnico"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => descripcionRef.current?.focus()}
            blurOnSubmit={false}
            maxLength={100}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Descripcion */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Descripcion *
          </Text>
          <TextInput
            ref={descripcionRef}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripcion del trabajo realizado"
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
            returnKeyType="next"
            blurOnSubmit
            onSubmitEditing={() => costoRef.current?.focus()}
            maxLength={500}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5 min-h-[90px]"
            style={{ textAlignVertical: "top" }}
          />

          {/* Costo */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Costo Total
          </Text>
          <TextInput
            ref={costoRef}
            value={costoTotal}
            onChangeText={(text) => setCostoTotal(formatCurrency(text))}
            placeholder="0"
            placeholderTextColor="#555"
            keyboardType="numeric"
            returnKeyType="done"
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Fotos */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fotos del Trabajo (max. 3)
          </Text>
          <View className="flex-row gap-2.5 mb-6 flex-wrap">
            {fotosUris.map((uri, index) => (
              <View key={index} className="w-[100px] h-[100px] rounded-xl overflow-hidden relative">
                <Image source={{ uri }} className="w-[100px] h-[100px]" resizeMode="cover" />
                <Pressable
                  onPress={() => removePhoto(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center active:scale-[0.98]"
                >
                  <Feather name="x" size={14} color="#FFF" />
                </Pressable>
              </View>
            ))}
            {fotosUris.length < 3 && (
              <Pressable
                onPress={pickImage}
                className="w-[100px] h-[100px] rounded-xl border-[1.5px] border-dashed border-border items-center justify-center bg-[#1A1A1A] active:scale-[0.98]"
              >
                <Feather name="camera" size={22} color="#555" />
                <Text className="text-[#555] text-[10px] font-inter-medium mt-1">{fotosUris.length}/3</Text>
              </Pressable>
            )}
          </View>

          {/* Repuestos — selector */}
          <View className="border-t border-border pt-5 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest">
                  Repuestos Utilizados
                </Text>
                {selectedIds.length > 0 && (
                  <View className="bg-accent/[0.12] px-2 py-0.5 rounded-[10px]">
                    <Text className="text-accent text-[11px] font-inter-semibold">{selectedIds.length}</Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => setShowRepuestoList((v) => !v)}
                className="flex-row items-center gap-1.5 bg-accent/[0.08] border border-accent/20 px-3 py-1.5 rounded-xl active:scale-[0.98]"
              >
                <Feather name={showRepuestoList ? "chevron-up" : "search"} size={14} color="#3B82F6" />
                <Text className="text-accent text-[12px] font-inter-medium">
                  {showRepuestoList ? "Cerrar" : "Seleccionar"}
                </Text>
              </Pressable>
            </View>

            {/* Chips de seleccionados */}
            {selectedRepuestos.length > 0 && (
              <View className="gap-2 mb-3">
                {selectedRepuestos.map((r) => {
                  const tc = repuestoTipoConfig[r.tipo] || repuestoTipoConfig.mecanico;
                  return (
                    <View key={r.id} className="bg-surface border border-border rounded-2xl px-4 py-3 flex-row items-center justify-between">
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 mb-0.5">
                          <Text className="text-textPrimary text-[14px] font-inter-medium" numberOfLines={1}>
                            {r.nombre}
                          </Text>
                          <View className="px-2 py-0.5 rounded-[8px]" style={{ backgroundColor: tc.bg }}>
                            <Text className="text-[10px] font-inter-medium capitalize" style={{ color: tc.color }}>
                              {r.tipo}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[#666] text-[12px] font-inter-regular">
                          {[r.codigo && `#${r.codigo}`, r.proveedor].filter(Boolean).join(" · ")}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => toggleRepuesto(r.id)}
                        className="w-7 h-7 rounded-full bg-danger/[0.08] items-center justify-center active:scale-[0.98]"
                      >
                        <Feather name="x" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Lista de búsqueda */}
            {showRepuestoList && (
              <View className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* Buscador */}
                <View className="flex-row items-center px-4 py-2.5 border-b border-border gap-2">
                  <Feather name="search" size={15} color="#666" />
                  <TextInput
                    value={repuestoSearch}
                    onChangeText={setRepuestoSearch}
                    placeholder="Buscar por nombre, código..."
                    placeholderTextColor="#555"
                    className="flex-1 text-textPrimary text-[14px] font-inter-regular py-1"
                  />
                  {repuestoSearch.length > 0 && (
                    <Pressable onPress={() => setRepuestoSearch("")}>
                      <Feather name="x" size={15} color="#666" />
                    </Pressable>
                  )}
                </View>

                {loadingRepuestos ? (
                  <View className="py-6 items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </View>
                ) : filteredRepuestos.length === 0 ? (
                  <View className="py-6 items-center gap-2">
                    <Feather name="package" size={22} color="#444" />
                    <Text className="text-[#555] text-[13px] font-inter-regular">
                      {allRepuestos.length === 0 ? "No hay repuestos registrados" : "Sin resultados"}
                    </Text>
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 260 }}>
                    {filteredRepuestos.map((r, idx) => {
                      const isChecked = selectedIds.includes(r.id);
                      const tc = repuestoTipoConfig[r.tipo] || repuestoTipoConfig.mecanico;
                      return (
                        <Pressable
                          key={r.id}
                          onPress={() => toggleRepuesto(r.id)}
                          className="px-4 py-3.5 flex-row items-center gap-3 active:bg-surfaceLight"
                          style={{
                            borderTopWidth: idx > 0 ? 1 : 0,
                            borderTopColor: "#2A2A2A",
                            backgroundColor: isChecked ? "rgba(59,130,246,0.05)" : "transparent",
                          }}
                        >
                          {/* Checkbox */}
                          <View
                            className="w-5 h-5 rounded-md items-center justify-center border-[1.5px]"
                            style={{
                              borderColor: isChecked ? "#3B82F6" : "#444",
                              backgroundColor: isChecked ? "#3B82F6" : "transparent",
                            }}
                          >
                            {isChecked && <Feather name="check" size={12} color="#FFF" />}
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-0.5">
                              <Text className="text-textPrimary text-[14px] font-inter-medium flex-1" numberOfLines={1}>
                                {r.nombre}
                              </Text>
                              <View className="px-1.5 py-0.5 rounded-[6px]" style={{ backgroundColor: tc.bg }}>
                                <Text className="text-[10px] font-inter-medium capitalize" style={{ color: tc.color }}>
                                  {r.tipo}
                                </Text>
                              </View>
                            </View>
                            <Text className="text-[#666] text-[12px] font-inter-regular">
                              {[
                                r.codigo && `#${r.codigo}`,
                                r.cantidad_disponible > 0 && `x${r.cantidad_disponible}`,
                                r.proveedor,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            {selectedIds.length === 0 && !showRepuestoList && (
              <Text className="text-[#555] text-[13px] font-inter-regular text-center py-1">
                Sin repuestos seleccionados
              </Text>
            )}
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
            className={`${canSubmit ? "bg-accent" : "bg-surfaceLight"} py-4 rounded-2xl items-center ${
              loading ? "opacity-70" : ""
            } active:scale-[0.98]`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={`${canSubmit ? "text-white" : "text-textMuted"} text-base font-inter-semibold`}>
                Guardar Mantenimiento
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
