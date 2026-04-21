import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { api, resetWakeUp } from "../../services/api";
import { Maquina } from "../../types/maquina";
import MaquinaCard from "../../components/MaquinaCard";
import AddMaquinaModal from "../../components/AddMaquinaModal";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { useFocusEffect } from "expo-router";
import { MaquinasListSkeleton } from "../../components/Skeleton";

export default function MaquinasScreen() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; actions: ConfirmDialogAction[]; icon?: any }>({
    visible: false, title: "", message: "", actions: [],
  });
  const { showToast } = useToast();

  const fetchMaquinas = useCallback(async () => {
    try {
      setLoadError(false);
      const data = await api.getMaquinas();
      setMaquinas(data);
    } catch {
      setLoadError(true);
      showToast("error", "No se pudieron cargar las máquinas. Desliza hacia abajo para reintentar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMaquinas();
    }, [fetchMaquinas])
  );

  const filteredMaquinas = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return maquinas;
    return maquinas.filter((m) =>
      m.nombre.toLowerCase().includes(q) ||
      (m.codigo || "").toLowerCase().includes(q) ||
      (m.ubicacion || "").toLowerCase().includes(q)
    );
  }, [maquinas, search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaquinas();
  };

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, visible: false }));

  const handleDelete = (id: string) => {
    setConfirm({
      visible: true,
      title: "Eliminar máquina",
      message: "¿Estás seguro de que deseas eliminarla? Esta acción no se puede deshacer.",
      icon: "trash-2",
      actions: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteMaquina(id);
              closeConfirm();
              setMaquinas((prev) => prev.filter((m) => m.id !== id));
              showToast("success", "Máquina eliminada correctamente");
            } catch (err: any) {
              if (err.status === 409) {
                // Reemplaza el contenido del diálogo con la opción de cascade
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
                          await api.deleteMaquina(id, true);
                          closeConfirm();
                          setMaquinas((prev) => prev.filter((m) => m.id !== id));
                          showToast("success", "Máquina y registros asociados eliminados");
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
                showToast("error", err.message || "No se pudo eliminar la máquina");
              }
            }
          },
        },
      ],
    });
  };

  const handleCreate = async (data: {
    nombre: string;
    descripcion: string;
    codigo: string;
    ubicacion: string;
    imagen_uri: string | null;
    estado: string;
    fecha_ultima_inspeccion: string | null;
  }) => {
    let imagen_url: string | null = null;

    if (data.imagen_uri) {
      try {
        imagen_url = await api.uploadImage(data.imagen_uri);
      } catch {
        showToast("error", "No se pudo subir la imagen. Intenta de nuevo.");
        throw new Error("upload_failed");
      }
    }

    const newMaquina = await api.createMaquina({
      nombre: data.nombre,
      descripcion: data.descripcion,
      codigo: data.codigo,
      ubicacion: data.ubicacion,
      imagen_url,
      estado: data.estado,
      fecha_ultima_inspeccion: data.fecha_ultima_inspeccion,
    });
    setMaquinas((prev) => [newMaquina, ...prev]);
    showToast("success", "Máquina creada correctamente");
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View className="px-5 pt-12 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-textPrimary text-[26px] font-inter-bold">
            Máquinas
          </Text>
          <Text className="text-textMuted text-sm font-inter-regular mt-0.5">
            {loading ? " " : `${maquinas.length} registrada${maquinas.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Agregar máquina"
          className="bg-accent w-[46px] h-[46px] rounded-2xl items-center justify-center active:scale-[0.98]"
        >
          <Feather name="plus" size={22} color="white" />
        </Pressable>
      </View>

      {/* Search bar */}
      {!loading && !loadError && (
        <View className="px-5 pb-3">
          <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 gap-2.5">
            <Feather name="search" size={16} color="#666" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre, código, ubicación..."
              placeholderTextColor="#555"
              className="flex-1 text-textPrimary text-[14px] font-inter-regular py-3.5"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={16} color="#666" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <MaquinasListSkeleton />
      ) : loadError && maquinas.length === 0 ? (
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
            onPress={() => { resetWakeUp(); setLoading(true); fetchMaquinas(); }}
            className="flex-row items-center gap-2 bg-accent px-6 py-3 rounded-2xl active:scale-[0.98]"
          >
            <Feather name="refresh-cw" size={16} color="white" />
            <Text className="text-white text-sm font-inter-medium">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
      <FlatList
        data={filteredMaquinas}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 4 }}
        renderItem={({ item }) => (
          <MaquinaCard maquina={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 100, gap: 4 }}
        showsVerticalScrollIndicator={false}
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
              <Feather name={search ? "search" : "settings"} size={36} color="#2A2A2A" />
            </View>
            <Text className="text-textSecondary text-base font-inter-medium mb-1.5">
              {search ? "Sin resultados" : "No hay máquinas registradas"}
            </Text>
            <Text className="text-[#555] text-sm font-inter-regular mb-6 text-center px-4">
              {search ? `No se encontró ninguna máquina con "${search}"` : "Agrega tu primera máquina para empezar"}
            </Text>
            {!search && (
              <Pressable
                onPress={() => setModalVisible(true)}
                className="flex-row items-center gap-2 bg-surface border border-border px-5 py-3 rounded-2xl active:scale-[0.98]"
              >
                <Feather name="plus" size={16} color="#3B82F6" />
                <Text className="text-accent text-sm font-inter-medium">
                  Agregar máquina
                </Text>
              </Pressable>
            )}
          </View>
        }
      />
      )}

      <AddMaquinaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
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
