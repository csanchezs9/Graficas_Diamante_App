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
import { toLocalISOString } from "../utils/date";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    descripcion: string;
    codigo: string;
    ubicacion: string;
    imagen_uri: string | null;
    estado: string;
    fecha_ultima_inspeccion: string | null;
  }) => Promise<void>;
}

const estadoOptions = ["En uso", "No en uso"];

export default function AddMaquinaModal({ visible, onClose, onSubmit }: Props) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [estado, setEstado] = useState("En uso");
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);
  const [fechaInspeccion, setFechaInspeccion] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const descripcionRef = useRef<TextInput>(null);
  const codigoRef = useRef<TextInput>(null);
  const ubicacionRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setCodigo("");
    setUbicacion("");
    setImagenUri(null);
    setEstado("En uso");
    setFechaInspeccion(null);
    setShowEstadoMenu(false);
    setShowDatePicker(false);
  };

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
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFechaInspeccion(new Date(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate()));
    }
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
        imagen_uri: imagenUri,
        estado: estado.toLowerCase(),
        fecha_ultima_inspeccion: fechaInspeccion
          ? toLocalISOString(fechaInspeccion)
          : null,
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
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-surface border-b border-border">
          <Pressable
            onPress={() => {
              resetForm();
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar formulario"
            className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center active:scale-[0.98]"
          >
            <Feather name="arrow-left" size={20} color="#A0A0A0" />
          </Pressable>
          <Text className="text-textPrimary text-lg font-inter-semibold">
            Nueva Máquina
          </Text>
          <View className="w-10" />
        </View>

        {/* Form scrollable */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nombre */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
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
            maxLength={100}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Descripcion */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
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
            maxLength={500}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5 min-h-[90px]"
            style={{ textAlignVertical: "top" }}
          />

          {/* Codigo */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
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
            maxLength={50}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-5"
          />

          {/* Ubicacion */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Ubicación
          </Text>
          <TextInput
            ref={ubicacionRef}
            value={ubicacion}
            onChangeText={setUbicacion}
            placeholder="Planta 1"
            placeholderTextColor="#555"
            returnKeyType="done"
            maxLength={100}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 text-textPrimary text-base font-inter-regular mb-6"
          />

          {/* Foto Principal */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Foto Principal
          </Text>
          <Pressable
            onPress={pickImage}
            className={`bg-surfaceLight border border-border rounded-2xl overflow-hidden mb-6 items-center justify-center active:scale-[0.98] ${!imagenUri ? "min-h-[120px] border-dashed" : ""}`}
          >
            {imagenUri ? (
              <View className="w-full">
                <Image
                  source={{ uri: imagenUri }}
                  className="w-full h-[180px] rounded-2xl"
                  resizeMode="cover"
                />
                {/* Overlay to change */}
                <View className="absolute bottom-2.5 right-2.5 flex-row items-center gap-1.5 bg-black/65 px-3 py-1.5 rounded-full">
                  <Feather name="edit-2" size={12} color="#F5F5F5" />
                  <Text className="text-textPrimary text-xs font-inter-medium">
                    Cambiar
                  </Text>
                </View>
              </View>
            ) : (
              <View className="items-center gap-2">
                <View className="w-12 h-12 rounded-full bg-accent/10 items-center justify-center">
                  <Feather name="camera" size={22} color="#3B82F6" />
                </View>
                <Text className="text-textSecondary text-[13px] font-inter-regular">
                  Seleccionar foto
                </Text>
              </View>
            )}
          </Pressable>

          {/* Estado (dropdown) */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Estado
          </Text>
          <View className="mb-6">
            <Pressable
              onPress={() => setShowEstadoMenu(!showEstadoMenu)}
              className={`bg-surfaceLight border ${showEstadoMenu ? "border-accent" : "border-border"} rounded-2xl px-4 py-3.5 flex-row items-center justify-between active:scale-[0.98]`}
            >
              <View className="flex-row items-center gap-2.5">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      estado === "En uso" ? "#22C55E" : "#F59E0B",
                  }}
                />
                <Text className="text-textPrimary text-base font-inter-regular">
                  {estado}
                </Text>
              </View>
              <Feather
                name={showEstadoMenu ? "chevron-up" : "chevron-down"}
                size={18}
                color="#A0A0A0"
              />
            </Pressable>

            {/* Dropdown menu */}
            {showEstadoMenu && (
              <View className="bg-surfaceLight border border-border rounded-xl mt-1.5 overflow-hidden">
                {estadoOptions.map((option, index) => {
                  const isSelected = estado === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setEstado(option);
                        setShowEstadoMenu(false);
                      }}
                      className="px-4 py-3.5 flex-row items-center justify-between active:scale-[0.98]"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(59,130,246,0.08)"
                          : "transparent",
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: "#2A2A2A",
                      }}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              option === "En uso" ? "#22C55E" : "#F59E0B",
                          }}
                        />
                        <Text
                          className={`text-[15px] ${isSelected ? "font-inter-medium text-accentLight" : "font-inter-regular text-textSecondary"}`}
                        >
                          {option}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={16} color="#60A5FA" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Fecha de Ultima Inspeccion */}
          <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
            Fecha de Última Inspección
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="bg-surfaceLight border border-border rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5 mb-8 active:scale-[0.98]"
          >
            <Feather
              name="calendar"
              size={18}
              color={fechaInspeccion ? "#3B82F6" : "#555"}
            />
            <Text
              className={`text-base font-inter-regular ${fechaInspeccion ? "text-textPrimary" : "text-[#555]"}`}
            >
              {fechaInspeccion
                ? fechaInspeccion.toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Seleccionar fecha"}
            </Text>
          </Pressable>

          {showDatePicker && (
            <View className="mb-6">
              <DatePicker
                value={fechaInspeccion || new Date()}
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

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !nombre.trim()}
            className={`${nombre.trim() ? "bg-accent" : "bg-surfaceLight"} py-4 rounded-2xl items-center active:scale-[0.98]`}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`text-base font-inter-semibold ${nombre.trim() ? "text-white" : "text-textMuted"}`}
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
