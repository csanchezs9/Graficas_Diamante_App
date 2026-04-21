import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api, resetWakeUp } from "../../services/api";
import { generateRepuestasPDF } from "../../utils/generateReport";
import { Mantenimiento } from "../../types/mantenimiento";
import { Repuesto } from "../../types/repuesto";
import AddRepuestoModal from "../../components/AddRepuestoModal";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import DeletePasswordModal from "../../components/DeletePasswordModal";
import { useToast } from "../../context/ToastContext";
import { RepuestosListSkeleton } from "../../components/Skeleton";

const tipoConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  mecanico: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: "settings", label: "Mecánico" },
  consumible: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "box", label: "Consumible" },
};

export default function RepuestosScreen() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; actions: ConfirmDialogAction[]; icon?: any }>({
    visible: false, title: "", message: "", actions: [],
  });
  const { showToast } = useToast();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const pendingDeleteIdRef = useRef<string>("");
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoadError(false);
      const [repData, mantData] = await Promise.all([
        api.getRepuestos(),
        api.getMantenimientos(),
      ]);
      setRepuestos(repData);
      setMantenimientos(mantData);
    } catch {
      setLoadError(true);
      showToast("error", "No se pudieron cargar los datos. Desliza hacia abajo para reintentar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreate = async (data: {
    mantenimiento_id: string | null;
    nombre: string;
    codigo: string;
    tipo: string;
    cantidad_disponible: number;
    costo_unitario: number;
    proveedor: string;
    fecha: string;
    imagen_uri: string | null;
  }) => {
    let imagen_url: string | null = null;
    if (data.imagen_uri) {
      try {
        imagen_url = await api.uploadImage(data.imagen_uri, "repuesto");
      } catch {
        showToast("error", "No se pudo subir la imagen. Intenta de nuevo.");
        throw new Error("upload_failed");
      }
    }

    try {
      const newRep = await api.createRepuesto({
        mantenimiento_id: data.mantenimiento_id,
        nombre: data.nombre,
        codigo: data.codigo,
        tipo: data.tipo,
        cantidad_disponible: data.cantidad_disponible,
        costo_unitario: data.costo_unitario,
        proveedor: data.proveedor,
        fecha: data.fecha,
        imagen_url,
      });
      setRepuestos((prev) => [newRep, ...prev]);
      showToast("success", "Repuesto creado correctamente");
    } catch {
      showToast("error", "No se pudo crear el repuesto");
      throw new Error("create_failed");
    }
  };

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, visible: false }));

  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    try {
      await generateRepuestasPDF(repuestos);
    } catch {
      showToast("error", "No se pudo generar el reporte");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDelete = (id: string) => {
    pendingDeleteIdRef.current = id;
    setPasswordModalVisible(true);
  };

  const handleDeleteWithPin = async (pin: string) => {
    const id = pendingDeleteIdRef.current;
    try {
      await api.deleteRepuesto(id, pin);
      setPasswordModalVisible(false);
      setRepuestos((prev) => prev.filter((r) => r.id !== id));
      showToast("success", "Repuesto eliminado correctamente");
    } catch (err: any) {
      if (err.status === 401) {
        throw err;
      } else {
        setPasswordModalVisible(false);
        showToast("error", err.message || "No se pudo eliminar");
      }
    }
  };

  const renderItem = ({ item }: { item: Repuesto }) => {
    const tc = tipoConfig[item.tipo] || tipoConfig.mecanico;
    const machineName = item.mantenimientos?.maquinas?.nombre || "—";
    const mantDesc = item.mantenimientos?.descripcion || "";

    const handleItemPress = () => {
      router.push({
        pathname: "/repuesto/[id]",
        params: { id: item.id, data: JSON.stringify(item) },
      });
    };

    return (
      <Pressable
        onPress={handleItemPress}
        className="bg-surface border-[0.5px] border-border rounded-2xl p-3.5 mx-5 mb-2.5 shadow-lg shadow-accent/5 active:scale-[0.98]"
      >
        {/* Top row: icon + name + type badge */}
        <View className="flex-row items-center mb-2.5">
          <View
            className="w-[38px] h-[38px] rounded-[10px] items-center justify-center mr-3"
            style={{ backgroundColor: tc.bg }}
          >
            <Feather name={tc.icon as any} size={18} color={tc.color} />
          </View>
          <View className="flex-1 mr-2">
            <Text
              numberOfLines={1}
              className="text-[#F0F0F0] text-base font-inter-semibold"
            >
              {item.nombre}
            </Text>
          </View>
          <View
            className="flex-row items-center px-2 py-[3px] rounded-lg gap-1"
            style={{ backgroundColor: tc.bg }}
          >
            <Text
              className="text-[10px] font-inter-semibold"
              style={{ color: tc.color }}
            >
              {tc.label}
            </Text>
          </View>
        </View>

        {/* Machine + maintenance association */}
        <View className="flex-row items-center gap-1.5 bg-[rgba(59,130,246,0.05)] rounded-lg px-2.5 py-[7px] mb-2.5">
          <Feather name="link" size={11} color="#3B82F6" />
          <Text
            numberOfLines={1}
            className="text-[#60A5FA] text-xs font-inter-medium flex-1"
          >
            {machineName}
          </Text>
          {mantDesc ? (
            <>
              <View className="w-px h-3 bg-border mx-1" />
              <Text
                numberOfLines={1}
                className="text-[#555] text-[11px] font-inter-regular flex-1"
              >
                {mantDesc}
              </Text>
            </>
          ) : null}
        </View>

        {/* Bottom row: qty + cost + provider */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3.5">
            <View className="flex-row items-center gap-1">
              <Feather name="layers" size={11} color="#444" />
              <Text className="text-[#666] text-xs font-inter-medium">
                {item.cantidad_disponible} uds
              </Text>
            </View>
            {item.costo_unitario > 0 && (
              <View className="flex-row items-center gap-1">
                <Feather name="dollar-sign" size={11} color="#444" />
                <Text className="text-[#666] text-xs font-inter-medium">
                  {item.costo_unitario.toLocaleString()}
                </Text>
              </View>
            )}
            {item.proveedor ? (
              <View className="flex-row items-center gap-1">
                <Feather name="truck" size={11} color="#444" />
                <Text
                  numberOfLines={1}
                  className="text-[#666] text-xs font-inter-medium"
                >
                  {item.proveedor}
                </Text>
              </View>
            ) : null}
          </View>
          <Feather name="chevron-right" size={16} color="#333" />
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View className="px-5 pt-12 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-textPrimary text-[26px] font-inter-bold">
            Repuestos
          </Text>
          <Text className="text-textMuted text-sm font-inter-regular mt-0.5">
            {loading ? " " : `${repuestos.length} repuesto${repuestos.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={handleGeneratePDF}
            disabled={generatingPdf || loading || repuestos.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Generar PDF"
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: "#1A1A1A",
              borderWidth: 1,
              borderColor: "#2A2A2A",
              alignItems: "center",
              justifyContent: "center",
              opacity: generatingPdf || repuestos.length === 0 ? 0.5 : 1,
            }}
          >
            {generatingPdf ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Feather name="file-text" size={20} color="#3B82F6" />
            )}
          </Pressable>
          <Pressable
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Agregar repuesto"
            className="bg-accent w-[46px] h-[46px] rounded-2xl items-center justify-center active:scale-[0.98]"
          >
            <Feather name="plus" size={22} color="white" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <RepuestosListSkeleton />
      ) : loadError && repuestos.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-5">
            <Feather name="wifi-off" size={36} color="#EF4444" />
          </View>
          <Text className="text-textSecondary text-base font-inter-medium mb-1.5 text-center">
            No se pudo conectar al servidor
          </Text>
          <Text className="text-[#555] text-sm font-inter-regular mb-6 text-center">
            El servidor puede estar iniciando. Intenta de nuevo en unos segundos.
          </Text>
          <Pressable
            onPress={() => { resetWakeUp(); setLoading(true); fetchData(); }}
            className="flex-row items-center gap-2 bg-accent px-6 py-3 rounded-2xl active:scale-[0.98]"
          >
            <Feather name="refresh-cw" size={16} color="white" />
            <Text className="text-white text-sm font-inter-medium">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
      <FlatList
        data={repuestos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
            progressBackgroundColor="#141414"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-5">
              <Feather name="package" size={36} color="#2A2A2A" />
            </View>
            <Text className="text-textSecondary text-base font-inter-medium mb-1.5">
              No hay repuestos
            </Text>
            <Text className="text-[#555] text-sm font-inter-regular mb-6">
              Registra el primer repuesto
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              className="flex-row items-center gap-2 bg-surface border border-border px-5 py-3 rounded-2xl active:scale-[0.98]"
            >
              <Feather name="plus" size={18} color="#3B82F6" />
              <Text className="text-textPrimary text-sm font-inter-medium">
                Nuevo repuesto
              </Text>
            </Pressable>
          </View>
        }
      />
      )}

      <AddRepuestoModal
        visible={modalVisible}
        mantenimientos={mantenimientos}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
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
