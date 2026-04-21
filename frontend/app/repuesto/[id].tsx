import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Repuesto } from "../../types/repuesto";
import { api } from "../../services/api";
import EditRepuestoModal from "../../components/EditRepuestoModal";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { parseDate } from "../../utils/date";
import { DetailSkeleton } from "../../components/Skeleton";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const tipoConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  mecanico: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: "settings", label: "Mecánico" },
  consumible: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "box", label: "Consumible" },
};

export default function RepuestoDetailScreen() {
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const router = useRouter();
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; actions: ConfirmDialogAction[]; icon?: any }>({
    visible: false, title: "", message: "", actions: [],
  });
  const { showToast } = useToast();

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      const fetchData = async () => {
        try {
          const rep = await api.getRepuesto(id);
          setRepuesto(rep);
        } catch {
          if (data) {
            try { setRepuesto(JSON.parse(data)); } catch {}
          }
        }
        setLoading(false);
      };

      fetchData();
    }, [id])
  );

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, visible: false }));

  const handleDelete = () => {
    if (!repuesto) return;
    setConfirm({
      visible: true,
      title: "Eliminar repuesto",
      message: "¿Estás seguro de que deseas eliminarlo? Esta acción no se puede deshacer.",
      icon: "trash-2",
      actions: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteRepuesto(repuesto.id);
              closeConfirm();
              showToast("success", "Repuesto eliminado");
              router.back();
            } catch (err: any) {
              closeConfirm();
              showToast("error", err.message || "No se pudo eliminar");
            }
          },
        },
      ],
    });
  };

  const handleEdit = async (editData: {
    nombre: string;
    codigo: string;
    tipo: string;
    cantidad_disponible: number;
    costo_unitario: number;
    proveedor: string;
    fecha: string;
    imagen_url_existing: string | null;
    imagen_uri_new: string | null;
  }) => {
    if (!repuesto) return;

    let imagen_url = editData.imagen_url_existing;

    // Delete old image if it's being replaced or removed
    if (repuesto.imagen_url && (editData.imagen_uri_new || !editData.imagen_url_existing)) {
      try {
        await api.deleteImage(repuesto.imagen_url);
      } catch {
        // Don't block update if old image deletion fails
      }
    }

    if (editData.imagen_uri_new) {
      try {
        imagen_url = await api.uploadImage(editData.imagen_uri_new, "repuesto");
      } catch {
        showToast("error", "No se pudo subir la imagen. Intenta de nuevo.");
        throw new Error("upload_failed");
      }
    }

    const updated = await api.updateRepuesto(repuesto.id, {
      nombre: editData.nombre,
      codigo: editData.codigo,
      tipo: editData.tipo,
      cantidad_disponible: editData.cantidad_disponible,
      costo_unitario: editData.costo_unitario,
      proveedor: editData.proveedor,
      fecha: editData.fecha,
      imagen_url: imagen_url || "",
    });
    setRepuesto(updated);
    setImgError(false);
    showToast("success", "Repuesto actualizado");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-surface border-b border-border">
          <View className="w-10 h-10 rounded-full bg-surfaceLight" />
          <Text className="text-textPrimary text-lg font-inter-semibold">Repuesto</Text>
          <View className="w-10 h-10 rounded-full bg-surfaceLight" />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DetailSkeleton hasImage />
        </ScrollView>
      </View>
    );
  }

  if (!repuesto) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <Feather name="alert-circle" size={40} color="#2A2A2A" />
        <Text className="text-textSecondary text-base font-inter-medium mt-3">
          Repuesto no encontrado
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 bg-surfaceLight rounded-xl active:scale-[0.98]"
        >
          <Text className="text-accent text-sm font-inter-medium">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const tc = tipoConfig[repuesto.tipo] || tipoConfig.mecanico;
  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-surface border-b border-border">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center active:scale-[0.98]"
        >
          <Feather name="arrow-left" size={20} color="#A0A0A0" />
        </Pressable>
        <Text
          className="text-textPrimary text-lg font-inter-semibold flex-1 text-center"
          numberOfLines={1}
        >
          Repuesto
        </Text>
        <Pressable
          onPress={() => setEditModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Editar repuesto"
          className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center active:scale-[0.98]"
        >
          <Feather name="edit-2" size={18} color="#3B82F6" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {repuesto.imagen_url && !imgError ? (
          <Pressable onPress={() => setPreviewImage(repuesto.imagen_url)}>
            <Image
              source={{ uri: repuesto.imagen_url }}
              style={{ width: "100%", height: 220 }}
              className="bg-surface"
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
            <View className="absolute bottom-3 right-3 bg-black/60 px-2.5 py-1.5 rounded-[10px] flex-row items-center gap-1">
              <Feather name="maximize-2" size={12} color="#FFF" />
              <Text className="text-white text-[11px] font-inter-medium">
                Ver
              </Text>
            </View>
          </Pressable>
        ) : repuesto.imagen_url && imgError ? (
          <View className="w-full h-40 bg-surface items-center justify-center">
            <Feather name="image" size={48} color="#2A2A2A" />
            <Text className="text-[#555] text-[13px] font-inter-regular mt-2">
              Error al cargar imagen
            </Text>
          </View>
        ) : null}

        <View className="p-5">
          {/* Name + type badge */}
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-textPrimary text-2xl font-inter-bold flex-1 mr-3"
              numberOfLines={2}
            >
              {repuesto.nombre}
            </Text>
            <View
              className="flex-row items-center px-3 py-1.5 rounded-[20px] gap-1.5"
              style={{ backgroundColor: tc.bg }}
            >
              <Feather name={tc.icon as any} size={14} color={tc.color} />
              <Text
                className="text-[13px] font-inter-medium"
                style={{ color: tc.color }}
              >
                {tc.label}
              </Text>
            </View>
          </View>

          {/* Info rows */}
          <View className="gap-2.5 mb-5">
            <InfoRow
              icon="hash"
              label="Código"
              value={repuesto.codigo || null}
            />
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
                  ? (parseDate(repuesto.fecha) ?? new Date()).toLocaleDateString("es-CO", {
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
                  ? (parseDate(repuesto.created_at) ?? new Date()).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null
              }
            />
          </View>

          {/* Edit button */}
          <Pressable
            onPress={() => setEditModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar repuesto"
            className="flex-row items-center justify-center gap-2 bg-accent/[0.08] border border-accent/20 py-3.5 rounded-2xl active:scale-[0.98]"
          >
            <Feather name="edit-2" size={16} color="#3B82F6" />
            <Text className="text-accent text-[15px] font-inter-medium">
              Editar Repuesto
            </Text>
          </Pressable>

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Eliminar repuesto"
            className="flex-row items-center justify-center gap-2 bg-danger/[0.08] border border-danger/20 py-3.5 rounded-2xl mt-2.5 active:scale-[0.98]"
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
            <Text className="text-danger text-[15px] font-inter-medium">
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
          <View className="flex-1 bg-black/95 items-center justify-center">
            <Pressable
              onPress={() => setPreviewImage(null)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar vista previa"
              style={{
                position: "absolute",
                top: 50,
                right: 20,
                zIndex: 10,
              }}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
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
      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        actions={confirm.actions}
        icon={confirm.icon}
        onClose={() => setConfirm((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

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
    <View className="flex-row items-center bg-surface border-[0.5px] border-border rounded-2xl px-4 py-3.5 gap-3">
      <View className="w-9 h-9 rounded-[10px] bg-surfaceLight items-center justify-center">
        <Feather name={icon} size={16} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-textMuted text-[11px] font-inter-medium uppercase tracking-wider mb-0.5">
          {label}
        </Text>
        <Text className={`text-[15px] font-inter-regular ${value ? "text-textPrimary" : "text-[#555]"}`}>
          {value || "No registrado"}
        </Text>
      </View>
    </View>
  );
}
