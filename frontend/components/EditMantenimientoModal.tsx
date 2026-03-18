import { useState, useEffect, useRef } from "react";
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
import { formatCurrency, parseCurrency } from "../utils/currency";

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
    fotos_urls_existing: string[];
    fotos_uris_new: string[];
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
  const [fotosUrlsExisting, setFotosUrlsExisting] = useState<string[]>([]);
  const [fotosUrisNew, setFotosUrisNew] = useState<string[]>([]);
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
          ? formatCurrency(String(mantenimiento.costo_total))
          : ""
      );
      setTipo(mantenimiento.tipo);
      setFotosUrlsExisting(mantenimiento.fotos_urls || []);
      setFotosUrisNew([]);
      setShowDatePicker(false);
    }
  }, [visible, mantenimiento]);

  const totalPhotos = fotosUrlsExisting.length + fotosUrisNew.length;

  const pickImage = async () => {
    if (totalPhotos >= 3) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFotosUrisNew((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeExistingPhoto = (index: number) => {
    setFotosUrlsExisting((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setFotosUrisNew((prev) => prev.filter((_, i) => i !== index));
  };

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
        costo_total: parseCurrency(costoTotal),
        tipo,
        fotos_urls_existing: fotosUrlsExisting,
        fotos_uris_new: fotosUrisNew,
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
            Editar Mantenimiento
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Tipo de Mantenimiento
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

          {/* Fecha */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fecha de Realización
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
                  className="self-center bg-accent px-6 py-2.5 rounded-xl mt-2 active:scale-[0.98]"
                >
                  <Text className="text-white text-sm font-inter-medium">
                    Confirmar
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Técnico */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Técnico Responsable
          </Text>
          <TextInput
            ref={tecnicoRef}
            value={tecnico}
            onChangeText={setTecnico}
            placeholder="Nombre del técnico"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => descripcionRef.current?.focus()}
            blurOnSubmit={false}
            maxLength={100}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Descripción */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Descripción
          </Text>
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

          {/* Fotos del trabajo */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fotos del Trabajo (máx. 3)
          </Text>
          <View className="flex-row gap-2.5 mb-8 flex-wrap">
            {/* Existing photos */}
            {fotosUrlsExisting.map((url, index) => (
              <View
                key={`existing-${index}`}
                className="w-[100px] h-[100px] rounded-xl overflow-hidden relative"
              >
                <Image
                  source={{ uri: url }}
                  className="w-[100px] h-[100px]"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => removeExistingPhoto(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center active:scale-[0.98]"
                >
                  <Feather name="x" size={14} color="#FFF" />
                </Pressable>
              </View>
            ))}

            {/* New photos */}
            {fotosUrisNew.map((uri, index) => (
              <View
                key={`new-${index}`}
                className="w-[100px] h-[100px] rounded-xl overflow-hidden relative"
              >
                <Image
                  source={{ uri }}
                  className="w-[100px] h-[100px]"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => removeNewPhoto(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center active:scale-[0.98]"
                >
                  <Feather name="x" size={14} color="#FFF" />
                </Pressable>
              </View>
            ))}

            {/* Add photo button */}
            {totalPhotos < 3 && (
              <Pressable
                onPress={pickImage}
                className="w-[100px] h-[100px] rounded-xl border-[1.5px] border-dashed border-border items-center justify-center bg-[#1A1A1A] active:scale-[0.98]"
              >
                <Feather name="camera" size={22} color="#555" />
                <Text className="text-[#555] text-[10px] font-inter-medium mt-1">
                  {totalPhotos}/3
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
                Guardar Cambios
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
