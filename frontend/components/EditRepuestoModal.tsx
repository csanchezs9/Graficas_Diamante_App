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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
    imagen_url_existing: string | null;
    imagen_uri_new: string | null;
  }) => Promise<void>;
}

const tipoOptions = [
  { value: "mecanico", label: "Mecanico", icon: "settings", color: "#3B82F6" },
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
  const [imagenUrlExisting, setImagenUrlExisting] = useState<string | null>(null);
  const [imagenUriNew, setImagenUriNew] = useState<string | null>(null);
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
      setImagenUrlExisting(repuesto.imagen_url || null);
      setImagenUriNew(null);
      setShowDatePicker(false);
    }
  }, [visible, repuesto]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const currentImage = imagenUriNew || imagenUrlExisting;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImagenUriNew(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImagenUrlExisting(null);
    setImagenUriNew(null);
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
        imagen_url_existing: imagenUrlExisting,
        imagen_uri_new: imagenUriNew,
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
            className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center active:scale-[0.98]"
          >
            <Feather name="x" size={20} color="#A0A0A0" />
          </Pressable>
          <Text className="text-textPrimary text-lg font-inter-semibold">
            Editar Repuesto
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
            Tipo de Repuesto
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

          {/* Nombre */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Nombre
          </Text>
          <TextInput
            ref={nombreRef}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre del repuesto"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => cantidadRef.current?.focus()}
            blurOnSubmit={false}
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
            onChangeText={setCostoUnitario}
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

          {/* Imagen */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Imagen del Repuesto
          </Text>
          <View className="flex-row gap-2.5 mb-8">
            {currentImage ? (
              <View className="w-[100px] h-[100px] rounded-xl overflow-hidden relative">
                <Image
                  source={{ uri: currentImage }}
                  className="w-[100px] h-[100px]"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={removeImage}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center active:scale-[0.98]"
                >
                  <Feather name="x" size={14} color="#FFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                className="w-[100px] h-[100px] rounded-xl border-[1.5px] border-dashed border-border items-center justify-center bg-[#1A1A1A] active:scale-[0.98]"
              >
                <Feather name="camera" size={22} color="#555" />
                <Text className="text-[#555] text-[10px] font-inter-medium mt-1">
                  Agregar
                </Text>
              </Pressable>
            )}
            {currentImage && (
              <Pressable
                onPress={pickImage}
                className="w-[100px] h-[100px] rounded-xl border-[1.5px] border-dashed border-border items-center justify-center bg-[#1A1A1A] active:scale-[0.98]"
              >
                <Feather name="refresh-cw" size={20} color="#555" />
                <Text className="text-[#555] text-[10px] font-inter-medium mt-1">
                  Cambiar
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
            } py-4 rounded-2xl items-center mt-3 ${
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
