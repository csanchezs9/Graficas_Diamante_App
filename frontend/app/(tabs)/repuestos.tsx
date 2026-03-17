import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "../../services/api";
import { Mantenimiento } from "../../types/mantenimiento";
import { Repuesto } from "../../types/repuesto";
import AddRepuestoModal from "../../components/AddRepuestoModal";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import { useToast } from "../../context/ToastContext";

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

  const fetchData = useCallback(async () => {
    try {
      const [repData, mantData] = await Promise.all([
        api.getRepuestos(),
        api.getMantenimientos(),
      ]);
      setRepuestos(repData);
      setMantenimientos(mantData);
    } catch {
      showToast("error", "No se pudieron cargar los datos");
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
    mantenimiento_id: string;
    nombre: string;
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
        showToast("warning", "No se pudo subir la imagen");
      }
    }

    const newRep = await api.createRepuesto({
      mantenimiento_id: data.mantenimiento_id,
      nombre: data.nombre,
      tipo: data.tipo,
      cantidad_disponible: data.cantidad_disponible,
      costo_unitario: data.costo_unitario,
      proveedor: data.proveedor,
      fecha: data.fecha,
      imagen_url,
    });
    setRepuestos((prev) => [newRep, ...prev]);
  };

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, visible: false }));

  const handleDelete = (id: string) => {
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
              await api.deleteRepuesto(id);
              closeConfirm();
              setRepuestos((prev) => prev.filter((r) => r.id !== id));
              showToast("success", "Repuesto eliminado correctamente");
            } catch (err: any) {
              closeConfirm();
              showToast("error", err.message || "No se pudo eliminar");
            }
          },
        },
      ],
    });
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
          {/* Top row: icon + name + type badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: tc.bg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Feather name={tc.icon as any} size={18} color={tc.color} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                numberOfLines={1}
                style={{
                  color: "#F0F0F0",
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {item.nombre}
              </Text>
            </View>
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

          {/* Machine + maintenance association */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(59,130,246,0.05)",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 7,
              marginBottom: 10,
            }}
          >
            <Feather name="link" size={11} color="#3B82F6" />
            <Text
              numberOfLines={1}
              style={{
                color: "#60A5FA",
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                flex: 1,
              }}
            >
              {machineName}
            </Text>
            {mantDesc ? (
              <>
                <View
                  style={{
                    width: 1,
                    height: 12,
                    backgroundColor: "#2A2A2A",
                    marginHorizontal: 4,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#555",
                    fontSize: 11,
                    fontFamily: "Inter_400Regular",
                    flex: 1,
                  }}
                >
                  {mantDesc}
                </Text>
              </>
            ) : null}
          </View>

          {/* Bottom row: qty + cost + provider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="layers" size={11} color="#444" />
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  {item.cantidad_disponible} uds
                </Text>
              </View>
              {item.costo_unitario > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="dollar-sign" size={11} color="#444" />
                  <Text
                    style={{
                      color: "#666",
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {item.costo_unitario.toLocaleString()}
                  </Text>
                </View>
              )}
              {item.proveedor ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="truck" size={11} color="#444" />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#666",
                      fontSize: 12,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {item.proveedor}
                  </Text>
                </View>
              ) : null}
            </View>
            <Feather name="chevron-right" size={16} color="#333" />
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
            Repuestos
          </Text>
          <Text
            style={{
              color: "#666",
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
          >
            {repuestos.length} repuesto{repuestos.length !== 1 ? "s" : ""}
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

      {/* List */}
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
              <Feather name="package" size={36} color="#2A2A2A" />
            </View>
            <Text
              style={{
                color: "#A0A0A0",
                fontSize: 16,
                fontFamily: "Inter_500Medium",
                marginBottom: 6,
              }}
            >
              No hay repuestos
            </Text>
            <Text
              style={{
                color: "#555",
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                marginBottom: 24,
              }}
            >
              Registra el primer repuesto
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
                Nuevo repuesto
              </Text>
            </Pressable>
          </View>
        }
      />

      <AddRepuestoModal
        visible={modalVisible}
        mantenimientos={mantenimientos}
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
