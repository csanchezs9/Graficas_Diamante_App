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
        costo_total: parseCurrency(costoTotal),
        tipo,
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
          {/* Tipo — pill selector */}
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
                  <Feather
                    name={opt.icon as any}
                    size={16}
                    color={isSelected ? opt.color : "#666"}
                  />
                  <Text
                    className={`text-sm ${
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

          {/* Maquina selector */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Maquina *
          </Text>
          <Pressable
            onPress={() => setShowMaquinaMenu(!showMaquinaMenu)}
            className={`bg-surfaceLight border rounded-2xl px-4 py-3.5 flex-row items-center justify-between active:scale-[0.98] ${
              showMaquinaMenu ? "border-accent mb-1.5" : "border-border mb-5"
            }`}
          >
            <Text
              className={`text-base font-inter-regular ${
                selectedMaquina ? "text-textPrimary" : "text-[#555]"
              }`}
            >
              {selectedMaquina?.nombre || "Seleccionar maquina"}
            </Text>
            <Feather
              name={showMaquinaMenu ? "chevron-up" : "chevron-down"}
              size={18}
              color="#A0A0A0"
            />
          </Pressable>
          {showMaquinaMenu && (
            <View className="bg-surfaceLight border border-border rounded-xl mb-5 max-h-[200px] overflow-hidden">
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
                      className="px-4 py-3.5 flex-row items-center justify-between"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(59,130,246,0.08)"
                          : "transparent",
                        borderTopWidth: idx > 0 ? 1 : 0,
                        borderTopColor: "#2A2A2A",
                      }}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <Feather
                          name="settings"
                          size={14}
                          color={isSelected ? "#3B82F6" : "#555"}
                        />
                        <Text
                          className={`text-[15px] ${
                            isSelected
                              ? "font-inter-medium text-[#60A5FA]"
                              : "font-inter-regular text-textSecondary"
                          }`}
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
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fecha de Realizacion *
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5 mb-5 active:scale-[0.98]"
          >
            <Feather name="calendar" size={18} color="#3B82F6" />
            <Text className="text-textPrimary text-base font-inter-regular">
              {fechaRealizacion.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Pressable>
          {showDatePicker && (
            <View className="mb-5 -mt-3">
              <DatePicker
                value={fechaRealizacion}
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

          {/* Fotos del trabajo (hasta 3) */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fotos del Trabajo (max. 3)
          </Text>
          <View className="flex-row gap-2.5 mb-8 flex-wrap">
            {fotosUris.map((uri, index) => (
              <View
                key={index}
                className="w-[100px] h-[100px] rounded-xl overflow-hidden relative"
              >
                <Image
                  source={{ uri }}
                  className="w-[100px] h-[100px]"
                  resizeMode="cover"
                />
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
                <Text className="text-[#555] text-[10px] font-inter-medium mt-1">
                  {fotosUris.length}/3
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
                Guardar Mantenimiento
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
