import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { api } from "../../services/api";
import { Maquina } from "../../types/maquina";
import { Mantenimiento } from "../../types/mantenimiento";
import AddMantenimientoModal from "../../components/AddMantenimientoModal";

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
      data = data.filter((m) => {
        const d = new Date(m.fecha_realizacion);
        return (
          d.getFullYear() === filterDate.getFullYear() &&
          d.getMonth() === filterDate.getMonth() &&
          d.getDate() === filterDate.getDate()
        );
      });
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

  const fetchData = useCallback(async () => {
    try {
      const [mantData, maqData] = await Promise.all([
        api.getMantenimientos(),
        api.getMaquinas(),
      ]);
      setMantenimientos(mantData);
      setMaquinas(maqData);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
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
        Alert.alert("Error", "No se pudo subir una imagen");
      }
    }

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
  };

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar", "¿Eliminar este mantenimiento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteMantenimiento(id);
            setMantenimientos((prev) => prev.filter((m) => m.id !== id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0A0A0A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

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
      <Pressable onPress={handleItemPress}>
        <View
          style={{
            backgroundColor: "#161616",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#222",
            padding: 14,
            marginHorizontal: 20,
            marginBottom: 10,
          }}
        >
          {/* Top row: machine name + type badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: "#F0F0F0",
                fontSize: 16,
                fontFamily: "Inter_600SemiBold",
                flex: 1,
                marginRight: 10,
              }}
            >
              {machineName}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: tc.bg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                gap: 4,
              }}
            >
              <Feather name={tc.icon as any} size={10} color={tc.color} />
              <Text
                style={{
                  color: tc.color,
                  fontSize: 10,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {tc.label}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text
            numberOfLines={2}
            style={{
              color: "#999",
              fontSize: 13,
              fontFamily: "Inter_400Regular",
              lineHeight: 18,
              marginBottom: 8,
            }}
          >
            {item.descripcion}
          </Text>

          {/* Bottom row: técnico + fecha */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="user" size={11} color="#444" />
              <Text
                style={{
                  color: "#666",
                  fontSize: 11,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {item.tecnico_responsable}
              </Text>
            </View>
            <Text
              style={{
                color: "#555",
                fontSize: 11,
                fontFamily: "Inter_400Regular",
              }}
            >
              {new Date(item.fecha_realizacion).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 48,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              color: "#F5F5F5",
              fontSize: 26,
              fontFamily: "Inter_700Bold",
            }}
          >
            Mantenimiento
          </Text>
          <Text
            style={{
              color: "#666",
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
          >
            {filteredData.length} de {mantenimientos.length} registro{mantenimientos.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: "#3B82F6",
            width: 46,
            height: 46,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="plus" size={22} color="white" />
        </Pressable>
      </View>

      {/* Filter toggle */}
      {mantenimientos.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: hasActiveFilters ? "rgba(59,130,246,0.12)" : "#1A1A1A",
                borderWidth: 1,
                borderColor: hasActiveFilters ? "#3B82F6" : "#2A2A2A",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
              }}
            >
              <Feather name="filter" size={14} color={hasActiveFilters ? "#60A5FA" : "#888"} />
              <Text
                style={{
                  color: hasActiveFilters ? "#60A5FA" : "#888",
                  fontSize: 13,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Filtrar
              </Text>
              {hasActiveFilters && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#3B82F6",
                  }}
                />
              )}
            </Pressable>

            {/* Active filter badges */}
            {filterTecnico && (
              <Pressable
                onPress={() => setFilterTecnico(null)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "rgba(59,130,246,0.12)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Feather name="user" size={11} color="#60A5FA" />
                <Text style={{ color: "#60A5FA", fontSize: 11, fontFamily: "Inter_500Medium" }}>
                  {filterTecnico}
                </Text>
                <Feather name="x" size={12} color="#60A5FA" />
              </Pressable>
            )}
            {filterDate && (
              <Pressable
                onPress={() => setFilterDate(null)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "rgba(59,130,246,0.12)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Feather name="calendar" size={11} color="#60A5FA" />
                <Text style={{ color: "#60A5FA", fontSize: 11, fontFamily: "Inter_500Medium" }}>
                  {filterDate.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
                <Feather name="x" size={12} color="#60A5FA" />
              </Pressable>
            )}

            {hasActiveFilters && (
              <Pressable onPress={clearFilters}>
                <Text style={{ color: "#EF4444", fontSize: 12, fontFamily: "Inter_500Medium" }}>
                  Limpiar
                </Text>
              </Pressable>
            )}
          </View>

          {/* Collapsible filter panel */}
          {showFilters && (
            <View
              style={{
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                borderRadius: 14,
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              {/* Por Técnico */}
              <View style={{ borderBottomWidth: 1, borderBottomColor: "#222" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingTop: 12,
                    paddingBottom: 8,
                  }}
                >
                  <Feather name="user" size={13} color="#555" />
                  <Text
                    style={{
                      color: "#A0A0A0",
                      fontSize: 11,
                      fontFamily: "Inter_600SemiBold",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
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
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          backgroundColor: active ? "rgba(59,130,246,0.08)" : "transparent",
                          borderTopWidth: idx > 0 ? 1 : 0,
                          borderTopColor: "#1E1E1E",
                        }}
                      >
                        <Text
                          style={{
                            color: active ? "#60A5FA" : "#D0D0D0",
                            fontSize: 14,
                            fontFamily: active ? "Inter_500Medium" : "Inter_400Regular",
                          }}
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
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="calendar" size={13} color="#555" />
                    <Text
                      style={{
                        color: "#A0A0A0",
                        fontSize: 11,
                        fontFamily: "Inter_600SemiBold",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      Por Fecha
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: filterDate ? "#60A5FA" : "#555",
                      fontSize: 13,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {filterDate
                      ? filterDate.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                      : "Seleccionar fecha"}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <View style={{ paddingBottom: 8 }}>
                    <DateTimePicker
                      value={filterDate || new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onDateChange}
                      themeVariant="dark"
                    />
                    {Platform.OS === "ios" && (
                      <Pressable
                        onPress={() => setShowDatePicker(false)}
                        style={{
                          alignSelf: "center",
                          backgroundColor: "#3B82F6",
                          paddingHorizontal: 24,
                          paddingVertical: 8,
                          borderRadius: 10,
                          marginTop: 4,
                        }}
                      >
                        <Text style={{ color: "#FFF", fontSize: 13, fontFamily: "Inter_500Medium" }}>
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
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#141414",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Feather name="tool" size={36} color="#2A2A2A" />
            </View>
            <Text
              style={{
                color: "#A0A0A0",
                fontSize: 16,
                fontFamily: "Inter_500Medium",
                marginBottom: 6,
              }}
            >
              No hay mantenimientos
            </Text>
            <Text
              style={{
                color: "#555",
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                marginBottom: 24,
              }}
            >
              Registra el primer mantenimiento
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#2A2A2A",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
              }}
            >
              <Feather name="plus" size={18} color="#3B82F6" />
              <Text
                style={{
                  color: "#F5F5F5",
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Nuevo mantenimiento
              </Text>
            </Pressable>
          </View>
        }
      />

      <AddMantenimientoModal
        visible={modalVisible}
        maquinas={maquinas}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
      />
    </View>
  );
}
