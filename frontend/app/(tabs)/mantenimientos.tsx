import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DatePicker from "../../components/DatePicker";
import { api, resetWakeUp } from "../../services/api";
import { Maquina } from "../../types/maquina";
import { Mantenimiento } from "../../types/mantenimiento";
import AddMantenimientoModal from "../../components/AddMantenimientoModal";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { MantenimientosListSkeleton } from "../../components/Skeleton";

const tipoConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  preventivo: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: "shield", label: "Preventivo" },
  correctivo: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "tool", label: "Correctivo" },
};

export default function MantenimientosScreen() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterTecnico, setFilterTecnico] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; actions: ConfirmDialogAction[]; icon?: any }>({
    visible: false, title: "", message: "", actions: [],
  });
  const { showToast } = useToast();

  // Extract unique technicians
  const uniqueTecnicos = useMemo(() => {
    const set = new Set(mantenimientos.map((m) => m.tecnico_responsable));
    return Array.from(set).sort();
  }, [mantenimientos]);

  const hasActiveFilters = !!filterTecnico || !!filterDate;

  // Filtered data
  const filteredData = useMemo(() => {
    let data = mantenimientos;
    if (filterTecnico) {
      data = data.filter((m) => m.tecnico_responsable === filterTecnico);
    }
    if (filterDate) {
      const filterStr = `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, "0")}-${String(filterDate.getDate()).padStart(2, "0")}`;
      data = data.filter((m) => m.fecha_realizacion.slice(0, 10) === filterStr);
    }
    return data;
  }, [mantenimientos, filterTecnico, filterDate]);

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setFilterDate(selectedDate);
  };

  const clearFilters = () => {
    setFilterTecnico(null);
    setFilterDate(null);
  };

  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoadError(false);
      const [mantData, maqData] = await Promise.all([
        api.getMantenimientos(),
        api.getMaquinas(),
      ]);
      setMantenimientos(mantData);
      setMaquinas(maqData);
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
    maquina_id: string;
    fecha_realizacion: string;
    tecnico_responsable: string;
    descripcion: string;
    fotos_uris: string[];
    costo_total: number;
    tipo: string;
  }) => {
    // Upload photos
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
      showToast("success", "Mantenimiento creado correctamente");
    } catch {
      showToast("error", "No se pudo crear el mantenimiento");
      throw new Error("create_failed");
    }
  };

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, visible: false }));

  const handleDelete = (id: string) => {
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
              await api.deleteMantenimiento(id);
              closeConfirm();
              setMantenimientos((prev) => prev.filter((m) => m.id !== id));
              showToast("success", "Mantenimiento eliminado correctamente");
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
                          await api.deleteMantenimiento(id, true);
                          closeConfirm();
                          setMantenimientos((prev) => prev.filter((m) => m.id !== id));
                          showToast("success", "Mantenimiento y repuestos eliminados");
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

  const renderItem = ({ item }: { item: Mantenimiento }) => {
    const tc = tipoConfig[item.tipo] || tipoConfig.preventivo;
    const machineName = item.maquinas?.nombre || "—";

    const handleItemPress = () => {
      router.push({
        pathname: "/mantenimiento/[id]",
        params: { id: item.id, data: JSON.stringify(item) },
      });
    };

    return (
      <Pressable
        onPress={handleItemPress}
        className="bg-surface border-[0.5px] border-border rounded-2xl p-3.5 mx-5 mb-2.5 shadow-lg shadow-accent/5 active:scale-[0.98]"
      >
        {/* Top row: machine name + type badge */}
        <View className="flex-row items-center justify-between mb-1.5">
          <Text
            numberOfLines={1}
            className="text-[#F0F0F0] text-base font-inter-semibold flex-1 mr-2.5"
          >
            {machineName}
          </Text>
          <View
            className="flex-row items-center px-2 py-[3px] rounded-lg gap-1"
            style={{ backgroundColor: tc.bg }}
          >
            <Feather name={tc.icon as any} size={10} color={tc.color} />
            <Text
              className="text-[10px] font-inter-semibold"
              style={{ color: tc.color }}
            >
              {tc.label}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text
          numberOfLines={2}
          className="text-[#999] text-[13px] font-inter-regular leading-[18px] mb-2"
        >
          {item.descripcion}
        </Text>

        {/* Bottom row: técnico + fecha */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-1">
            <Feather name="user" size={11} color="#444" />
            <Text className="text-[#666] text-[11px] font-inter-medium">
              {item.tecnico_responsable}
            </Text>
          </View>
          <Text className="text-[#555] text-[11px] font-inter-regular">
            {new Date(item.fecha_realizacion).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
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
            Mantenimiento
          </Text>
          <Text className="text-textMuted text-sm font-inter-regular mt-0.5">
            {loading ? " " : `${filteredData.length} de ${mantenimientos.length} registro${mantenimientos.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Agregar mantenimiento"
          className="bg-accent w-[46px] h-[46px] rounded-2xl items-center justify-center active:scale-[0.98]"
        >
          <Feather name="plus" size={22} color="white" />
        </Pressable>
      </View>

      {loading ? (
        <MantenimientosListSkeleton />
      ) : loadError && mantenimientos.length === 0 ? (
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
      <>
      {/* Filter toggle */}
      {mantenimientos.length > 0 && (
        <View className="px-5 pb-2.5">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                hasActiveFilters
                  ? "bg-accent/[0.12] border-accent"
                  : "bg-[#1A1A1A] border-border"
              }`}
            >
              <Feather name="filter" size={14} color={hasActiveFilters ? "#60A5FA" : "#888"} />
              <Text
                className={`text-[13px] font-inter-medium ${
                  hasActiveFilters ? "text-[#60A5FA]" : "text-[#888]"
                }`}
              >
                Filtrar
              </Text>
              {hasActiveFilters && (
                <View className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </Pressable>

            {/* Active filter badges */}
            {filterTecnico && (
              <Pressable
                onPress={() => setFilterTecnico(null)}
                className="flex-row items-center gap-1 bg-accent/[0.12] px-2.5 py-1.5 rounded-[10px]"
              >
                <Feather name="user" size={11} color="#60A5FA" />
                <Text className="text-[#60A5FA] text-[11px] font-inter-medium">
                  {filterTecnico}
                </Text>
                <Feather name="x" size={12} color="#60A5FA" />
              </Pressable>
            )}
            {filterDate && (
              <Pressable
                onPress={() => setFilterDate(null)}
                className="flex-row items-center gap-1 bg-accent/[0.12] px-2.5 py-1.5 rounded-[10px]"
              >
                <Feather name="calendar" size={11} color="#60A5FA" />
                <Text className="text-[#60A5FA] text-[11px] font-inter-medium">
                  {filterDate.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
                <Feather name="x" size={12} color="#60A5FA" />
              </Pressable>
            )}

            {hasActiveFilters && (
              <Pressable onPress={clearFilters}>
                <Text className="text-danger text-xs font-inter-medium">
                  Limpiar
                </Text>
              </Pressable>
            )}
          </View>

          {/* Collapsible filter panel */}
          {showFilters && (
            <View className="bg-surface border border-border rounded-2xl mt-2.5 overflow-hidden">
              {/* Por Técnico */}
              <View className="border-b border-[#222]">
                <View className="flex-row items-center gap-1.5 px-3.5 pt-3 pb-2">
                  <Feather name="user" size={13} color="#555" />
                  <Text className="text-textSecondary text-[11px] font-inter-semibold uppercase tracking-widest">
                    Por Técnico
                  </Text>
                </View>
                <ScrollView
                  style={{ maxHeight: 200 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {uniqueTecnicos.map((t, idx) => {
                    const active = filterTecnico === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => {
                          setFilterTecnico(active ? null : t);
                          setShowFilters(false);
                        }}
                        className="flex-row items-center justify-between px-3.5 py-3"
                        style={{
                          backgroundColor: active ? "rgba(59,130,246,0.08)" : "transparent",
                          borderTopWidth: idx > 0 ? 1 : 0,
                          borderTopColor: "#1E1E1E",
                        }}
                      >
                        <Text
                          className={`text-sm ${
                            active
                              ? "text-[#60A5FA] font-inter-medium"
                              : "text-[#D0D0D0] font-inter-regular"
                          }`}
                        >
                          {t}
                        </Text>
                        {active && <Feather name="check" size={16} color="#60A5FA" />}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Por Fecha */}
              <View>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center justify-between px-3.5 py-3"
                >
                  <View className="flex-row items-center gap-1.5">
                    <Feather name="calendar" size={13} color="#555" />
                    <Text className="text-textSecondary text-[11px] font-inter-semibold uppercase tracking-widest">
                      Por Fecha
                    </Text>
                  </View>
                  <Text
                    className={`text-[13px] font-inter-regular ${
                      filterDate ? "text-[#60A5FA]" : "text-[#555]"
                    }`}
                  >
                    {filterDate
                      ? filterDate.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                      : "Seleccionar fecha"}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <View className="pb-2">
                    <DatePicker
                      value={filterDate || new Date()}
                      onChange={onDateChange}
                    />
                    {Platform.OS === "ios" && (
                      <Pressable
                        onPress={() => setShowDatePicker(false)}
                        className="self-center bg-accent px-6 py-2 rounded-[10px] mt-1"
                      >
                        <Text className="text-white text-[13px] font-inter-medium">
                          Confirmar
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Filtered list */}
      <FlatList
        data={filteredData}
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
          hasActiveFilters ? (
            <View className="items-center justify-center pt-20">
              <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-5">
                <Feather name="search" size={36} color="#2A2A2A" />
              </View>
              <Text className="text-textSecondary text-base font-inter-medium mb-1.5">
                Sin resultados para los filtros aplicados
              </Text>
              <Text className="text-[#555] text-sm font-inter-regular mb-6">
                Intenta con otros filtros
              </Text>
              <Pressable
                onPress={() => {
                  setFilterTecnico(null);
                  setFilterDate(null);
                }}
                className="flex-row items-center gap-2 bg-surface border border-border px-5 py-3 rounded-2xl active:scale-[0.98]"
              >
                <Feather name="x" size={18} color="#EF4444" />
                <Text className="text-danger text-sm font-inter-medium">
                  Limpiar filtros
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center justify-center pt-20">
              <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-5">
                <Feather name="tool" size={36} color="#2A2A2A" />
              </View>
              <Text className="text-textSecondary text-base font-inter-medium mb-1.5">
                No hay mantenimientos
              </Text>
              <Text className="text-[#555] text-sm font-inter-regular mb-6">
                Registra el primer mantenimiento
              </Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                className="flex-row items-center gap-2 bg-surface border border-border px-5 py-3 rounded-2xl active:scale-[0.98]"
              >
                <Feather name="plus" size={18} color="#3B82F6" />
                <Text className="text-textPrimary text-sm font-inter-medium">
                  Nuevo mantenimiento
                </Text>
              </Pressable>
            </View>
          )
        }
      />
      </>
      )}

      <AddMantenimientoModal
        visible={modalVisible}
        maquinas={maquinas}
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
