import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useRef } from "react";
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
import { Maquina } from "../../types/maquina";
import { Mantenimiento } from "../../types/mantenimiento";
import { api } from "../../services/api";
import EditMaquinaModal from "../../components/EditMaquinaModal";
import AddMantenimientoModal from "../../components/AddMantenimientoModal";
import LinkedItemCard from "../../components/LinkedItemCard";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import DeletePasswordModal from "../../components/DeletePasswordModal";
import { parseDate } from "../../utils/date";
import { useToast } from "../../context/ToastContext";
import { DetailSkeleton } from "../../components/Skeleton";

const tipoConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  preventivo: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: "shield", label: "Preventivo" },
  correctivo: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "tool", label: "Correctivo" },
};

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
  const [imgError, setImgError] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addMantenimientoVisible, setAddMantenimientoVisible] = useState(false);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; actions: ConfirmDialogAction[]; icon?: any }>({
    visible: false, title: "", message: "", actions: [],
  });
  const { showToast } = useToast();
  const pendingPinRef = useRef<string>("");
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      const fetchData = async () => {
        try {
          const maq = await api.getMaquina(id);
          setMaquina(maq);
        } catch {
          if (data) {
            try { setMaquina(JSON.parse(data)); } catch {}
          }
        }

        try {
          const mants = await api.getMantenimientos(id);
          setMantenimientos(mants);
        } catch {}

        setLoading(false);
      };

      fetchData();
    }, [id])
  );

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
      // Delete old image from storage if it exists
      if (maquina.imagen_url) {
        try {
          await api.deleteImage(maquina.imagen_url);
        } catch {
          // Don't block update if old image deletion fails
        }
      }
      try {
        imagen_url = await api.uploadImage(editData.imagen_uri);
      } catch {
        showToast("error", "No se pudo subir la imagen. Intenta de nuevo.");
        throw new Error("upload_failed");
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
    setImgError(false);
    showToast("success", "Máquina actualizada");
  };

  const handleCreateMantenimiento = async (data: {
    maquina_id: string;
    fecha_realizacion: string;
    tecnico_responsable: string;
    descripcion: string;
    fotos_uris: string[];
    costo_total: number;
    tipo: string;
    selected_repuesto_ids: string[];
  }) => {
    const fotos_urls: string[] = [];
    for (const uri of data.fotos_uris) {
      try {
        const url = await api.uploadImage(uri, "trabajo");
        fotos_urls.push(url);
      } catch {
        showToast("error", "No se pudo subir una imagen. Intenta de nuevo.");
        throw new Error("upload_failed");
      }
    }
    try {
      const newMant = await api.createMantenimiento({
        maquina_id: data.maquina_id,
        fecha_realizacion: data.fecha_realizacion,
        tecnico_responsable: data.tecnico_responsable,
        descripcion: data.descripcion,
        fotos_urls,
        costo_total: data.costo_total,
        tipo: data.tipo,
      });
      setMantenimientos((prev) => [newMant, ...prev]);

      for (const repId of data.selected_repuesto_ids) {
        try {
          await api.linkRepuesto(newMant.id, repId);
        } catch {
          // non-blocking
        }
      }

      const suffix = data.selected_repuesto_ids.length > 0
        ? ` y ${data.selected_repuesto_ids.length} repuesto${data.selected_repuesto_ids.length > 1 ? "s" : ""} vinculados`
        : "";
      showToast("success", `Mantenimiento creado${suffix}`);
    } catch {
      showToast("error", "No se pudo crear el mantenimiento");
      throw new Error("create_failed");
    }
  };

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, visible: false }));

  const handleDelete = () => {
    if (!maquina) return;
    setPasswordModalVisible(true);
  };

  const handleDeleteWithPin = async (pin: string) => {
    try {
      await api.deleteMaquina(maquina!.id, false, pin);
      setPasswordModalVisible(false);
      showToast("success", "Máquina eliminada");
      router.back();
    } catch (err: any) {
      if (err.status === 409) {
        pendingPinRef.current = pin;
        setPasswordModalVisible(false);
        setConfirm({
          visible: true,
          title: "Tiene registros asociados",
          message: `${err.message}\n\n¿Deseas eliminar la máquina junto con todos sus mantenimientos y repuestos?`,
          icon: "alert-triangle",
          actions: [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar todo",
              style: "destructive",
              onPress: async () => {
                try {
                  await api.deleteMaquina(maquina!.id, true, pendingPinRef.current);
                  closeConfirm();
                  showToast("success", "Máquina y registros eliminados");
                  router.back();
                } catch (e: any) {
                  closeConfirm();
                  showToast("error", e.message || "No se pudo eliminar");
                }
              },
            },
          ],
        });
      } else if (err.status === 401) {
        throw err;
      } else {
        setPasswordModalVisible(false);
        showToast("error", err.message || "No se pudo eliminar");
      }
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-surface border-b border-border">
          <View className="w-10 h-10 rounded-full bg-surfaceLight" />
          <Text className="text-textPrimary text-lg font-inter-semibold">Detalle</Text>
          <View className="w-10 h-10 rounded-full bg-surfaceLight" />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DetailSkeleton hasImage />
        </ScrollView>
      </View>
    );
  }

  if (!maquina) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <Feather name="alert-circle" size={40} color="#2A2A2A" />
        <Text className="text-textSecondary text-base font-inter-medium mt-3">
          Máquina no encontrada
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

  const estado = maquina.estado?.toLowerCase() || "";
  const badge = estadoConfig[estado] || { bg: "rgba(102,102,102,0.12)", text: "#666", dot: "#666" };

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
          Detalle
        </Text>
        <Pressable
          onPress={() => setEditModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Editar máquina"
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
        {/* Imagen (tappable para preview) */}
        {maquina.imagen_url && !imgError ? (
          <Pressable onPress={() => setImagePreviewVisible(true)}>
            <Image
              source={{ uri: maquina.imagen_url }}
              style={{ width: "100%", height: 220 }}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
            <View className="absolute bottom-2.5 right-2.5 flex-row items-center gap-[5px] bg-black/60 px-2.5 py-[5px] rounded-2xl">
              <Feather name="maximize-2" size={12} color="#F5F5F5" />
              <Text className="text-textPrimary text-[11px] font-inter-medium">
                Ver
              </Text>
            </View>
          </Pressable>
        ) : (
          <View className="w-full h-40 bg-surface items-center justify-center">
            <Feather name="image" size={48} color="#2A2A2A" />
            <Text className="text-[#555] text-[13px] font-inter-regular mt-2">
              Sin imagen
            </Text>
          </View>
        )}

        <View className="p-5">
          {/* Nombre + Estado badge */}
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-textPrimary text-2xl font-inter-bold flex-1 mr-3"
              numberOfLines={2}
            >
              {maquina.nombre}
            </Text>
            <View
              className="flex-row items-center px-3 py-1.5 rounded-[20px] gap-1.5"
              style={{ backgroundColor: badge.bg }}
            >
              <View
                className="w-[7px] h-[7px] rounded-full"
                style={{ backgroundColor: badge.dot }}
              />
              <Text
                className="text-[13px] font-inter-medium capitalize"
                style={{ color: badge.text }}
              >
                {maquina.estado}
              </Text>
            </View>
          </View>

          {/* Descripción */}
          {maquina.descripcion ? (
            <View className="mb-5">
              <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-1.5">
                Descripción
              </Text>
              <Text className="text-[#D0D0D0] text-[15px] font-inter-regular leading-[22px]">
                {maquina.descripcion}
              </Text>
            </View>
          ) : null}

          {/* Info cards */}
          <View className="gap-2.5 mb-5">
            <InfoRow icon="hash" label="Código" value={maquina.codigo} />
            <InfoRow icon="map-pin" label="Ubicación" value={maquina.ubicacion} />
            <InfoRow
              icon="calendar"
              label="Última Inspección"
              value={
                maquina.fecha_ultima_inspeccion
                  ? (parseDate(maquina.fecha_ultima_inspeccion) ?? new Date()).toLocaleDateString(
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
                  ? (parseDate(maquina.created_at) ?? new Date()).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : null
              }
            />
          </View>

          {/* Mantenimientos section */}
          <View className="mt-2">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest">
                  Mantenimientos
                </Text>
                {mantenimientos.length > 0 && (
                  <View className="bg-accent/[0.12] px-2 py-0.5 rounded-[10px]">
                    <Text className="text-accent text-[11px] font-inter-semibold">
                      {mantenimientos.length}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => setAddMantenimientoVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Añadir mantenimiento"
                className="flex-row items-center gap-1.5 bg-accent/[0.08] border border-accent/20 px-3 py-1.5 rounded-xl active:scale-[0.98]"
              >
                <Feather name="plus" size={14} color="#3B82F6" />
                <Text className="text-accent text-[12px] font-inter-medium">Añadir</Text>
              </Pressable>
            </View>

            {mantenimientos.length === 0 ? (
              <View className="bg-surface border border-border rounded-2xl p-5 items-center">
                <Text className="text-[#555] text-[13px] font-inter-regular">
                  Sin mantenimientos registrados
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {mantenimientos.map((m) => {
                  const tc = tipoConfig[m.tipo] || tipoConfig.preventivo;
                  const foto = m.fotos_urls?.[0] || null;
                  const fechaStr = (parseDate(m.fecha_realizacion) ?? new Date()).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const metaParts = [m.tecnico_responsable, m.costo_total > 0 ? `$${m.costo_total.toLocaleString()}` : ""].filter(Boolean);
                  return (
                    <LinkedItemCard
                      key={m.id}
                      imageUrl={foto}
                      fallbackIcon="tool"
                      title={m.descripcion}
                      subtitle={fechaStr}
                      meta={metaParts.join(" · ")}
                      badgeLabel={tc.label}
                      badgeColor={tc.color}
                      badgeBg={tc.bg}
                      badgeIcon={tc.icon as any}
                      onPress={() =>
                        router.push({
                          pathname: "/mantenimiento/[id]",
                          params: { id: m.id, data: JSON.stringify(m) },
                        })
                      }
                    />
                  );
                })}
              </View>
            )}
          </View>

          {/* Edit button */}
          <Pressable
            onPress={() => setEditModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar máquina"
            className="flex-row items-center justify-center gap-2 bg-accent/[0.08] border border-accent/20 py-3.5 rounded-2xl mt-3 active:scale-[0.98]"
          >
            <Feather name="edit-2" size={16} color="#3B82F6" />
            <Text className="text-accent text-[15px] font-inter-medium">
              Editar Máquina
            </Text>
          </Pressable>

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Eliminar máquina"
            className="flex-row items-center justify-center gap-2 bg-danger/[0.08] border border-danger/20 py-3.5 rounded-2xl mt-2.5 active:scale-[0.98]"
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
            <Text className="text-danger text-[15px] font-inter-medium">
              Eliminar Máquina
            </Text>
          </Pressable>
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
          <View className="flex-1 bg-black/95 items-center justify-center">
            <Pressable
              onPress={() => setImagePreviewVisible(false)}
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
              source={{ uri: maquina.imagen_url }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 0.7,
              }}
              resizeMode="contain"
              onError={() => setImagePreviewVisible(false)}
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

      {/* Add mantenimiento modal */}
      <AddMantenimientoModal
        visible={addMantenimientoVisible}
        maquinas={maquina ? [maquina] : []}
        defaultMaquinaId={maquina?.id}
        onClose={() => setAddMantenimientoVisible(false)}
        onSubmit={handleCreateMantenimiento}
      />
      <DeletePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onSubmit={handleDeleteWithPin}
      />
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
