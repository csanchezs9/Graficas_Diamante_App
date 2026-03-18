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
import { Mantenimiento } from "../../types/mantenimiento";
import { Repuesto } from "../../types/repuesto";
import { api } from "../../services/api";
import EditMantenimientoModal from "../../components/EditMantenimientoModal";
import LinkedItemCard from "../../components/LinkedItemCard";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { DetailSkeleton } from "../../components/Skeleton";

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
  const [failedImgs, setFailedImgs] = useState<Set<number>>(new Set());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; actions: ConfirmDialogAction[]; icon?: any }>({
    visible: false, title: "", message: "", actions: [],
  });
  const { showToast } = useToast();

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
        } catch {
          showToast("warning", "No se pudieron cargar los repuestos");
        }

        setLoading(false);
      };

      fetchData();
    }, [id])
  );

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, visible: false }));

  const handleDelete = () => {
    if (!mantenimiento) return;
    setConfirm({
      visible: true,
      title: "Eliminar mantenimiento",
      message: "¿Estás seguro de que deseas eliminarlo? Esta acción no se puede deshacer.",
      icon: "trash-2",
      actions: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteMantenimiento(mantenimiento.id);
              closeConfirm();
              showToast("success", "Mantenimiento eliminado");
              router.back();
            } catch (err: any) {
              if (err.status === 409) {
                setConfirm({
                  visible: true,
                  title: "Tiene registros asociados",
                  message: `${err.message}\n\n¿Deseas eliminar el mantenimiento junto con todos sus repuestos?`,
                  icon: "alert-triangle",
                  actions: [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar todo",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await api.deleteMantenimiento(mantenimiento.id, true);
                          closeConfirm();
                          showToast("success", "Mantenimiento y repuestos eliminados");
                          router.back();
                        } catch (e: any) {
                          closeConfirm();
                          showToast("error", e.message || "No se pudo eliminar");
                        }
                      },
                    },
                  ],
                });
              } else {
                closeConfirm();
                showToast("error", err.message || "No se pudo eliminar");
              }
            }
          },
        },
      ],
    });
  };

  const handleEdit = async (editData: {
    fecha_realizacion: string;
    tecnico_responsable: string;
    descripcion: string;
    costo_total: number;
    tipo: string;
    fotos_urls_existing: string[];
    fotos_uris_new: string[];
  }) => {
    if (!mantenimiento) return;

    // Delete removed photos from storage
    const originalUrls = mantenimiento.fotos_urls || [];
    const removedUrls = originalUrls.filter(
      (url) => !editData.fotos_urls_existing.includes(url)
    );
    for (const url of removedUrls) {
      try {
        await api.deleteImage(url);
      } catch {
        // Don't block update if old image deletion fails
      }
    }

    // Upload new photos
    const newUrls: string[] = [];
    for (const uri of editData.fotos_uris_new) {
      try {
        const url = await api.uploadImage(uri, "trabajo");
        newUrls.push(url);
      } catch {
        showToast("error", "No se pudo subir una imagen. Intenta de nuevo.");
        throw new Error("upload_failed");
      }
    }

    const fotos_urls = [...editData.fotos_urls_existing, ...newUrls];

    const updated = await api.updateMantenimiento(mantenimiento.id, {
      fecha_realizacion: editData.fecha_realizacion,
      tecnico_responsable: editData.tecnico_responsable,
      descripcion: editData.descripcion,
      costo_total: editData.costo_total,
      tipo: editData.tipo,
      fotos_urls,
    });
    setMantenimiento(updated);
    showToast("success", "Mantenimiento actualizado");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-surface border-b border-border">
          <View className="w-10 h-10 rounded-full bg-surfaceLight" />
          <Text className="text-textPrimary text-lg font-inter-semibold">Mantenimiento</Text>
          <View className="w-10 h-10 rounded-full bg-surfaceLight" />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DetailSkeleton hasImage={false} />
        </ScrollView>
      </View>
    );
  }

  if (!mantenimiento) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <Text className="text-textSecondary text-base font-inter-medium">
          Mantenimiento no encontrado
        </Text>
      </View>
    );
  }

  const tc = tipoConfig[mantenimiento.tipo] || tipoConfig.preventivo;
  const machineName = mantenimiento.maquinas?.nombre || "—";

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
          Mantenimiento
        </Text>
        <Pressable
          onPress={() => setEditModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Editar mantenimiento"
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
        <View className="p-5">
          {/* Machine name + type badge */}
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-textPrimary text-2xl font-inter-bold flex-1 mr-3"
              numberOfLines={2}
            >
              {machineName}
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

          {/* Descripción */}
          <View className="mb-5">
            <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-1.5">
              Descripción
            </Text>
            <Text className="text-[#D0D0D0] text-[15px] font-inter-regular leading-[22px]">
              {mantenimiento.descripcion}
            </Text>
          </View>

          {/* Info rows */}
          <View className="gap-2.5 mb-5">
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
            <View className="mb-5">
              <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
                Fotos del Trabajo ({mantenimiento.fotos_urls.length})
              </Text>
              <View className="flex-row gap-2.5">
                {mantenimiento.fotos_urls.map((url, i) => (
                  <Pressable
                    key={i}
                    onPress={() => !failedImgs.has(i) && setPreviewImage(url)}
                    className="flex-1 h-[120px] rounded-xl overflow-hidden"
                  >
                    {failedImgs.has(i) ? (
                      <View className="w-full h-[120px] bg-surfaceLight items-center justify-center">
                        <Feather name="image" size={24} color="#333" />
                        <Text className="text-[#555] text-[10px] font-inter-regular mt-1">Error</Text>
                      </View>
                    ) : (
                      <>
                        <Image
                          source={{ uri: url }}
                          style={{ width: "100%", height: 120 }}
                          resizeMode="cover"
                          onError={() => setFailedImgs((prev) => new Set(prev).add(i))}
                        />
                        <View className="absolute bottom-1.5 right-1.5 bg-black/60 px-1.5 py-[3px] rounded-lg">
                          <Feather name="maximize-2" size={10} color="#FFF" />
                        </View>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Repuestos utilizados */}
          <View className="mb-5">
            <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-2">
              Repuestos Utilizados ({repuestos.length})
            </Text>
            {repuestos.length > 0 ? (
              <View className="gap-2">
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
              <View className="bg-surface border border-border rounded-xl py-5 items-center">
                <Feather name="package" size={20} color="#333" />
                <Text className="text-[#555] text-[13px] font-inter-regular mt-1.5">
                  Sin repuestos registrados
                </Text>
              </View>
            )}
          </View>

          {/* Edit button */}
          <Pressable
            onPress={() => setEditModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar mantenimiento"
            className="flex-row items-center justify-center gap-2 bg-accent/[0.08] border border-accent/20 py-3.5 rounded-2xl mt-3 active:scale-[0.98]"
          >
            <Feather name="edit-2" size={16} color="#3B82F6" />
            <Text className="text-accent text-[15px] font-inter-medium">
              Editar Mantenimiento
            </Text>
          </Pressable>

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Eliminar mantenimiento"
            className="flex-row items-center justify-center gap-2 bg-danger/[0.08] border border-danger/20 py-3.5 rounded-2xl mt-2.5 active:scale-[0.98]"
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
            <Text className="text-danger text-[15px] font-inter-medium">
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

      {mantenimiento && (
        <EditMantenimientoModal
          visible={editModalVisible}
          mantenimiento={mantenimiento}
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
