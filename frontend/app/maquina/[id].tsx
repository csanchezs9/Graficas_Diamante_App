import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Maquina } from "../../types/maquina";
import { api } from "../../services/api";
import EditMaquinaModal from "../../components/EditMaquinaModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const estadoConfig: Record<string, { bg: string; text: string; dot: string }> = {
  "en uso": { bg: "rgba(34,197,94,0.12)", text: "#22C55E", dot: "#22C55E" },
  "no en uso": { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B" },
};

export default function MaquinaDetailScreen() {
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const router = useRouter();
  const [maquina, setMaquina] = useState<Maquina | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (data) {
      try {
        setMaquina(JSON.parse(data));
      } catch {
        // fallback
      }
    }
    setLoading(false);
  }, [data]);

  const handleEdit = async (editData: {
    nombre: string;
    descripcion: string;
    codigo: string;
    ubicacion: string;
    imagen_uri: string | null;
    imagen_url_existing: string | null;
    estado: string;
    fecha_ultima_inspeccion: string | null;
  }) => {
    if (!maquina) return;

    let imagen_url = editData.imagen_url_existing;

    // Upload new image if one was selected
    if (editData.imagen_uri) {
      try {
        imagen_url = await api.uploadImage(editData.imagen_uri);
      } catch {
        Alert.alert("Error", "No se pudo subir la imagen");
      }
    }

    const updated = await api.updateMaquina(maquina.id, {
      nombre: editData.nombre,
      descripcion: editData.descripcion,
      codigo: editData.codigo,
      ubicacion: editData.ubicacion,
      imagen_url,
      estado: editData.estado,
      fecha_ultima_inspeccion: editData.fecha_ultima_inspeccion,
    });

    setMaquina(updated);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!maquina) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <Text style={{ color: "#A0A0A0", fontSize: 16, fontFamily: "Inter_500Medium" }}>
          Máquina no encontrada
        </Text>
      </View>
    );
  }

  const estado = maquina.estado?.toLowerCase() || "";
  const badge = estadoConfig[estado] || { bg: "rgba(102,102,102,0.12)", text: "#666", dot: "#666" };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

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
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#1E1E1E",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="arrow-left" size={20} color="#A0A0A0" />
        </Pressable>
        <Text
          style={{
            color: "#F5F5F5",
            fontSize: 18,
            fontFamily: "Inter_600SemiBold",
            flex: 1,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          Detalle
        </Text>
        {/* Edit button */}
        <Pressable
          onPress={() => setEditModalVisible(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#1E1E1E",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="edit-2" size={18} color="#3B82F6" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagen (tappable para preview) */}
        {maquina.imagen_url ? (
          <Pressable onPress={() => setImagePreviewVisible(true)}>
            <Image
              source={{ uri: maquina.imagen_url }}
              style={{ width: "100%", height: 220 }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(0,0,0,0.6)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 16,
              }}
            >
              <Feather name="maximize-2" size={12} color="#F5F5F5" />
              <Text
                style={{
                  color: "#F5F5F5",
                  fontSize: 11,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Ver
              </Text>
            </View>
          </Pressable>
        ) : (
          <View
            style={{
              width: "100%",
              height: 160,
              backgroundColor: "#141414",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="image" size={48} color="#2A2A2A" />
            <Text
              style={{
                color: "#555",
                fontSize: 13,
                fontFamily: "Inter_400Regular",
                marginTop: 8,
              }}
            >
              Sin imagen
            </Text>
          </View>
        )}

        <View style={{ padding: 20 }}>
          {/* Nombre + Estado badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: "#F5F5F5",
                fontSize: 24,
                fontFamily: "Inter_700Bold",
                flex: 1,
                marginRight: 12,
              }}
              numberOfLines={2}
            >
              {maquina.nombre}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: badge.bg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: badge.dot,
                }}
              />
              <Text
                style={{
                  color: badge.text,
                  fontSize: 13,
                  fontFamily: "Inter_500Medium",
                  textTransform: "capitalize",
                }}
              >
                {maquina.estado}
              </Text>
            </View>
          </View>

          {/* Descripción */}
          {maquina.descripcion ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={sectionLabel}>Descripción</Text>
              <Text
                style={{
                  color: "#D0D0D0",
                  fontSize: 15,
                  fontFamily: "Inter_400Regular",
                  lineHeight: 22,
                }}
              >
                {maquina.descripcion}
              </Text>
            </View>
          ) : null}

          {/* Info cards */}
          <View style={{ gap: 10, marginBottom: 20 }}>
            <InfoRow icon="hash" label="Código" value={maquina.codigo} />
            <InfoRow icon="map-pin" label="Ubicación" value={maquina.ubicacion} />
            <InfoRow
              icon="calendar"
              label="Última Inspección"
              value={
                maquina.fecha_ultima_inspeccion
                  ? new Date(maquina.fecha_ultima_inspeccion).toLocaleDateString(
                      "es-CO",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : null
              }
            />
            <InfoRow
              icon="clock"
              label="Fecha de Registro"
              value={
                maquina.created_at
                  ? new Date(maquina.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null
              }
            />
          </View>
        </View>
      </ScrollView>

      {/* Full-screen image preview modal */}
      {maquina.imagen_url && (
        <Modal
          visible={imagePreviewVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setImagePreviewVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.95)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pressable
              onPress={() => setImagePreviewVisible(false)}
              style={{
                position: "absolute",
                top: 50,
                right: 20,
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>

            <Image
              source={{ uri: maquina.imagen_url }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 0.7,
              }}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}

      {/* Edit modal */}
      <EditMaquinaModal
        visible={editModalVisible}
        maquina={maquina}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleEdit}
      />
    </View>
  );
}

// ── Shared ──

const sectionLabel = {
  color: "#A0A0A0",
  fontSize: 12,
  fontFamily: "Inter_500Medium",
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  marginBottom: 6,
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#141414",
        borderWidth: 1,
        borderColor: "#2A2A2A",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "#1E1E1E",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={16} color="#3B82F6" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#666",
            fontSize: 11,
            fontFamily: "Inter_500Medium",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: value ? "#F5F5F5" : "#555",
            fontSize: 15,
            fontFamily: "Inter_400Regular",
          }}
        >
          {value || "No registrado"}
        </Text>
      </View>
    </View>
  );
}
