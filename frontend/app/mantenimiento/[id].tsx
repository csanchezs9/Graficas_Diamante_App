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
import { Mantenimiento } from "../../types/mantenimiento";
import { Repuesto } from "../../types/repuesto";
import { api } from "../../services/api";
import EditMantenimientoModal from "../../components/EditMantenimientoModal";
import LinkedItemCard from "../../components/LinkedItemCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const tipoConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  preventivo: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: "shield", label: "Preventivo" },
  correctivo: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "tool", label: "Correctivo" },
};

export default function MantenimientoDetailScreen() {
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const router = useRouter();
  const [mantenimiento, setMantenimiento] = useState<Mantenimiento | null>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      const fetchData = async () => {
        // Fetch mantenimiento and repuestos independently so one failure doesn't block the other
        try {
          const mant = await api.getMantenimiento(id);
          setMantenimiento(mant);
        } catch {
          if (data) {
            try { setMantenimiento(JSON.parse(data)); } catch {}
          }
        }

        try {
          const reps = await api.getRepuestos(id);
          setRepuestos(reps);
        } catch {}

        setLoading(false);
      };

      fetchData();
    }, [id])
  );

  const handleDelete = () => {
    if (!mantenimiento) return;
    Alert.alert("Eliminar", "¿Eliminar este mantenimiento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteMantenimiento(mantenimiento.id);
            router.back();
          } catch {
            Alert.alert("Error", "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  const handleEdit = async (editData: {
    fecha_realizacion: string;
    tecnico_responsable: string;
    descripcion: string;
    costo_total: number;
    tipo: string;
  }) => {
    if (!mantenimiento) return;
    const updated = await api.updateMantenimiento(mantenimiento.id, editData);
    setMantenimiento(updated);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!mantenimiento) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <Text style={{ color: "#A0A0A0", fontSize: 16, fontFamily: "Inter_500Medium" }}>
          Mantenimiento no encontrado
        </Text>
      </View>
    );
  }

  const tc = tipoConfig[mantenimiento.tipo] || tipoConfig.preventivo;
  const machineName = mantenimiento.maquinas?.nombre || "—";

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
          Mantenimiento
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
        <View style={{ padding: 20 }}>
          {/* Machine name + type badge */}
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
              {machineName}
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

          {/* Descripción */}
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
              {mantenimiento.descripcion}
            </Text>
          </View>

          {/* Info rows */}
          <View style={{ gap: 10, marginBottom: 20 }}>
            <InfoRow
              icon="user"
              label="Técnico Responsable"
              value={mantenimiento.tecnico_responsable}
            />
            <InfoRow
              icon="calendar"
              label="Fecha de Realización"
              value={
                new Date(mantenimiento.fecha_realizacion).toLocaleDateString(
                  "es-CO",
                  { year: "numeric", month: "long", day: "numeric" }
                )
              }
            />
            <InfoRow
              icon="dollar-sign"
              label="Costo Total"
              value={
                mantenimiento.costo_total > 0
                  ? `$${mantenimiento.costo_total.toLocaleString()}`
                  : null
              }
            />
            <InfoRow
              icon="clock"
              label="Registrado"
              value={
                mantenimiento.created_at
                  ? new Date(mantenimiento.created_at).toLocaleDateString(
                      "es-CO",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : null
              }
            />
          </View>

          {/* Fotos del trabajo */}
          {mantenimiento.fotos_urls && mantenimiento.fotos_urls.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={sectionLabel}>
                Fotos del Trabajo ({mantenimiento.fotos_urls.length})
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {mantenimiento.fotos_urls.map((url, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setPreviewImage(url)}
                    style={{
                      flex: 1,
                      height: 120,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: url }}
                      style={{ width: "100%", height: 120 }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Feather name="maximize-2" size={10} color="#FFF" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Repuestos utilizados */}
          <View style={{ marginBottom: 20 }}>
            <Text style={sectionLabel}>
              Repuestos Utilizados ({repuestos.length})
            </Text>
            {repuestos.length > 0 ? (
              <View style={{ gap: 8 }}>
                {repuestos.map((rep) => {
                  const metaParts = [
                    `Cant: ${rep.cantidad_disponible}`,
                    rep.costo_unitario > 0 ? `$${rep.costo_unitario.toLocaleString()}` : "",
                  ].filter(Boolean);
                  return (
                    <LinkedItemCard
                      key={rep.id}
                      imageUrl={rep.imagen_url}
                      fallbackIcon="package"
                      title={rep.nombre}
                      subtitle={rep.proveedor || undefined}
                      meta={metaParts.join(" · ")}
                      onPress={() =>
                        router.push({
                          pathname: "/repuesto/[id]",
                          params: { id: rep.id, data: JSON.stringify(rep) },
                        })
                      }
                    />
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#141414",
                  borderWidth: 1,
                  borderColor: "#2A2A2A",
                  borderRadius: 12,
                  paddingVertical: 20,
                  alignItems: "center",
                }}
              >
                <Feather name="package" size={20} color="#333" />
                <Text
                  style={{
                    color: "#555",
                    fontSize: 13,
                    fontFamily: "Inter_400Regular",
                    marginTop: 6,
                  }}
                >
                  Sin repuestos registrados
                </Text>
              </View>
            )}
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
              marginTop: 12,
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
              Editar Mantenimiento
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
              Eliminar Mantenimiento
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

      {mantenimiento && (
        <EditMantenimientoModal
          visible={editModalVisible}
          mantenimiento={mantenimiento}
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
