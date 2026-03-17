import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
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
import { Repuesto } from "../../types/repuesto";
import { Mantenimiento } from "../../types/mantenimiento";
import { api } from "../../services/api";
import EditRepuestoModal from "../../components/EditRepuestoModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const tipoConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  mecanico: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: "settings", label: "Mecánico" },
  consumible: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "box", label: "Consumible" },
};

export default function RepuestoDetailScreen() {
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const router = useRouter();
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [mantenimiento, setMantenimiento] = useState<Mantenimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      const fetchData = async () => {
        let rep: Repuesto | null = null;

        try {
          rep = await api.getRepuesto(id);
          setRepuesto(rep);
        } catch {
          if (data) {
            try {
              rep = JSON.parse(data);
              setRepuesto(rep);
            } catch {}
          }
        }

        if (rep?.mantenimiento_id) {
          try {
            const mant = await api.getMantenimiento(rep.mantenimiento_id);
            setMantenimiento(mant);
          } catch {}
        }

        setLoading(false);
      };

      fetchData();
    }, [id])
  );

  const handleDelete = () => {
    if (!repuesto) return;
    Alert.alert("Eliminar", "¿Eliminar este repuesto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteRepuesto(repuesto.id);
            router.back();
          } catch {
            Alert.alert("Error", "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  const handleEdit = async (editData: {
    nombre: string;
    tipo: string;
    cantidad_disponible: number;
    costo_unitario: number;
    proveedor: string;
    fecha: string;
  }) => {
    if (!repuesto) return;
    const updated = await api.updateRepuesto(repuesto.id, editData);
    setRepuesto(updated);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!repuesto) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <Text style={{ color: "#A0A0A0", fontSize: 16, fontFamily: "Inter_500Medium" }}>
          Repuesto no encontrado
        </Text>
      </View>
    );
  }

  const tc = tipoConfig[repuesto.tipo] || tipoConfig.mecanico;
  const machineName = repuesto.mantenimientos?.maquinas?.nombre || "—";

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
          Repuesto
        </Text>
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
        {/* Image */}
        {repuesto.imagen_url && (
          <Pressable onPress={() => setPreviewImage(repuesto.imagen_url)}>
            <Image
              source={{ uri: repuesto.imagen_url }}
              style={{
                width: "100%",
                height: 220,
                backgroundColor: "#141414",
              }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                backgroundColor: "rgba(0,0,0,0.6)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Feather name="maximize-2" size={12} color="#FFF" />
              <Text style={{ color: "#FFF", fontSize: 11, fontFamily: "Inter_500Medium" }}>
                Ver
              </Text>
            </View>
          </Pressable>
        )}

        <View style={{ padding: 20 }}>
          {/* Name + type badge */}
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
              {repuesto.nombre}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: tc.bg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                gap: 6,
              }}
            >
              <Feather name={tc.icon as any} size={14} color={tc.color} />
              <Text
                style={{
                  color: tc.color,
                  fontSize: 13,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {tc.label}
              </Text>
            </View>
          </View>

          {/* Info rows */}
          <View style={{ gap: 10, marginBottom: 20 }}>
            <InfoRow
              icon="layers"
              label="Cantidad Disponible"
              value={String(repuesto.cantidad_disponible)}
            />
            <InfoRow
              icon="dollar-sign"
              label="Costo Unitario"
              value={
                repuesto.costo_unitario > 0
                  ? `$${repuesto.costo_unitario.toLocaleString()}`
                  : null
              }
            />
            <InfoRow
              icon="truck"
              label="Proveedor"
              value={repuesto.proveedor || null}
            />
            <InfoRow
              icon="calendar"
              label="Fecha"
              value={
                repuesto.fecha
                  ? new Date(repuesto.fecha).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null
              }
            />
            <InfoRow
              icon="clock"
              label="Registrado"
              value={
                repuesto.created_at
                  ? new Date(repuesto.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null
              }
            />
          </View>

          {/* Mantenimiento Asociado */}
          <View style={{ marginTop: 8, marginBottom: 20 }}>
            <Text style={sectionLabel}>Mantenimiento Asociado</Text>
            <Pressable
              onPress={() => {
                if (mantenimiento) {
                  router.push({
                    pathname: "/mantenimiento/[id]",
                    params: { id: mantenimiento.id, data: JSON.stringify(mantenimiento) },
                  });
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 12,
                padding: 12,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: "#1E1E1E",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="tool" size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#F0F0F0",
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  {machineName}
                </Text>
                {(mantenimiento?.descripcion || repuesto.mantenimientos?.descripcion) ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#666",
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      marginTop: 3,
                    }}
                  >
                    {mantenimiento?.descripcion || repuesto.mantenimientos?.descripcion}
                  </Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={16} color="#444" />
            </Pressable>
          </View>

          {/* Edit button */}
          <Pressable
            onPress={() => setEditModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "rgba(59,130,246,0.08)",
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.2)",
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <Feather name="edit-2" size={16} color="#3B82F6" />
            <Text
              style={{
                color: "#3B82F6",
                fontSize: 15,
                fontFamily: "Inter_500Medium",
              }}
            >
              Editar Repuesto
            </Text>
          </Pressable>

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "rgba(239,68,68,0.08)",
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.2)",
              paddingVertical: 14,
              borderRadius: 14,
              marginTop: 10,
            }}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
            <Text
              style={{
                color: "#EF4444",
                fontSize: 15,
                fontFamily: "Inter_500Medium",
              }}
            >
              Eliminar Repuesto
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Full-screen image preview */}
      {previewImage && (
        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPreviewImage(null)}
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
              onPress={() => setPreviewImage(null)}
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
              source={{ uri: previewImage }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 0.7,
              }}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}

      {repuesto && (
        <EditRepuestoModal
          visible={editModalVisible}
          repuesto={repuesto}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleEdit}
        />
      )}
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
  marginBottom: 8,
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
