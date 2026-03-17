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
  maquina: Maquina;
  onClose: () => void;
  onSubmit: (data: {
    nombre: string;
    descripcion: string;
    codigo: string;
    ubicacion: string;
    imagen_uri: string | null;
    imagen_url_existing: string | null;
    estado: string;
    fecha_ultima_inspeccion: string | null;
  }) => Promise<void>;
}

const estadoOptions = ["En uso", "No en uso"];

function capitalizeEstado(estado: string): string {
  const lower = estado.toLowerCase();
  if (lower === "en uso") return "En uso";
  if (lower === "no en uso") return "No en uso";
  return "En uso";
}

export default function EditMaquinaModal({ visible, maquina, onClose, onSubmit }: Props) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [imagenUrlExisting, setImagenUrlExisting] = useState<string | null>(null);
  const [estado, setEstado] = useState("En uso");
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);
  const [fechaInspeccion, setFechaInspeccion] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const descripcionRef = useRef<TextInput>(null);
  const codigoRef = useRef<TextInput>(null);
  const ubicacionRef = useRef<TextInput>(null);

  // Pre-fill form with existing data
  useEffect(() => {
    if (visible && maquina) {
      setNombre(maquina.nombre || "");
      setDescripcion(maquina.descripcion || "");
      setCodigo(maquina.codigo || "");
      setUbicacion(maquina.ubicacion || "");
      setImagenUri(null);
      setImagenUrlExisting(maquina.imagen_url || null);
      setEstado(capitalizeEstado(maquina.estado || "en uso"));
      setFechaInspeccion(
        maquina.fecha_ultima_inspeccion
          ? new Date(maquina.fecha_ultima_inspeccion)
          : null
      );
      setShowEstadoMenu(false);
      setShowDatePicker(false);
    }
  }, [visible, maquina]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImagenUri(result.assets[0].uri);
      setImagenUrlExisting(null);
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFechaInspeccion(selectedDate);
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
        imagen_url_existing: imagenUrlExisting,
        estado: estado.toLowerCase(),
        fecha_ultima_inspeccion: fechaInspeccion
          ? fechaInspeccion.toISOString()
          : null,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const currentImagePreview = imagenUri || imagenUrlExisting;

  // ── Shared styles ──
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
            Editar Máquina
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form scrollable */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Nombre */}
          <Text style={labelStyle}>Nombre *</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Prensa Offset 4C"
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
            placeholder="Descripción de la máquina"
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
            returnKeyType="next"
            blurOnSubmit={true}
            onSubmitEditing={() => codigoRef.current?.focus()}
            style={{
              ...inputStyle,
              minHeight: 90,
              textAlignVertical: "top",
            }}
          />

          {/* Código */}
          <Text style={labelStyle}>Código</Text>
          <TextInput
            ref={codigoRef}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="MQ-001"
            placeholderTextColor="#555"
            returnKeyType="next"
            onSubmitEditing={() => ubicacionRef.current?.focus()}
            blurOnSubmit={false}
            style={inputStyle}
          />

          {/* Ubicación */}
          <Text style={labelStyle}>Ubicación</Text>
          <TextInput
            ref={ubicacionRef}
            value={ubicacion}
            onChangeText={setUbicacion}
            placeholder="Planta 1"
            placeholderTextColor="#555"
            returnKeyType="done"
            style={{ ...inputStyle, marginBottom: 24 }}
          />

          {/* Foto Principal */}
          <Text style={labelStyle}>Foto Principal</Text>
          <Pressable
            onPress={pickImage}
            style={{
              backgroundColor: "#1E1E1E",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 24,
              minHeight: currentImagePreview ? undefined : 120,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {currentImagePreview ? (
              <View style={{ width: "100%" }}>
                <Image
                  source={{ uri: currentImagePreview }}
                  style={{ width: "100%", height: 180, borderRadius: 13 }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(0,0,0,0.65)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Feather name="edit-2" size={12} color="#F5F5F5" />
                  <Text
                    style={{
                      color: "#F5F5F5",
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    Cambiar
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "rgba(59,130,246,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="camera" size={22} color="#3B82F6" />
                </View>
                <Text
                  style={{
                    color: "#A0A0A0",
                    fontSize: 13,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  Seleccionar foto
                </Text>
              </View>
            )}
          </Pressable>

          {/* Estado (dropdown) */}
          <Text style={labelStyle}>Estado</Text>
          <View style={{ marginBottom: 24 }}>
            <Pressable
              onPress={() => setShowEstadoMenu(!showEstadoMenu)}
              style={{
                backgroundColor: "#1E1E1E",
                borderWidth: 1,
                borderColor: showEstadoMenu ? "#3B82F6" : "#2A2A2A",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: estado === "En uso" ? "#22C55E" : "#F59E0B",
                  }}
                />
                <Text
                  style={{
                    color: "#F5F5F5",
                    fontSize: 16,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {estado}
                </Text>
              </View>
              <Feather
                name={showEstadoMenu ? "chevron-up" : "chevron-down"}
                size={18}
                color="#A0A0A0"
              />
            </Pressable>

            {showEstadoMenu && (
              <View
                style={{
                  backgroundColor: "#1E1E1E",
                  borderWidth: 1,
                  borderColor: "#2A2A2A",
                  borderRadius: 12,
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                {estadoOptions.map((option, index) => {
                  const isSelected = estado === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setEstado(option);
                        setShowEstadoMenu(false);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: isSelected
                          ? "rgba(59,130,246,0.08)"
                          : "transparent",
                        borderTopWidth: index > 0 ? 1 : 0,
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
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: option === "En uso" ? "#22C55E" : "#F59E0B",
                          }}
                        />
                        <Text
                          style={{
                            color: isSelected ? "#60A5FA" : "#A0A0A0",
                            fontSize: 15,
                            fontFamily: isSelected ? "Inter_500Medium" : "Inter_400Regular",
                          }}
                        >
                          {option}
                        </Text>
                      </View>
                      {isSelected && <Feather name="check" size={16} color="#60A5FA" />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Fecha de Última Inspección */}
          <Text style={labelStyle}>Fecha de Última Inspección</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: "#1E1E1E",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 32,
            }}
          >
            <Feather
              name="calendar"
              size={18}
              color={fechaInspeccion ? "#3B82F6" : "#555"}
            />
            <Text
              style={{
                color: fechaInspeccion ? "#F5F5F5" : "#555",
                fontSize: 16,
                fontFamily: "Inter_400Regular",
              }}
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
            <View style={{ marginBottom: 24 }}>
              <DateTimePicker
                value={fechaInspeccion || new Date()}
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

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !nombre.trim()}
            style={{
              backgroundColor: nombre.trim() ? "#3B82F6" : "#1E1E1E",
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
                  color: nombre.trim() ? "#FFFFFF" : "#666",
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
