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
import { api } from "../../services/api";
import { Maquina } from "../../types/maquina";
import MaquinaCard from "../../components/MaquinaCard";
import AddMaquinaModal from "../../components/AddMaquinaModal";
import ConfirmDialog, { ConfirmDialogAction } from "../../components/ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import { useFocusEffect } from "expo-router";

export default function MaquinasScreen() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message: string; actions: ConfirmDialogAction[]; icon?: any }>({
    visible: false, title: "", message: "", actions: [],
  });
  const { showToast } = useToast();

  const fetchMaquinas = useCallback(async () => {
    try {
      const data = await api.getMaquinas();
      setMaquinas(data);
    } catch {
      showToast("error", "No se pudieron cargar las máquinas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMaquinas();
    }, [fetchMaquinas])
  );

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
        showToast("warning", "No se pudo subir la imagen");
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

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
            Máquinas
          </Text>
          <Text
            style={{
              color: "#666",
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              marginTop: 2,
            }}
          >
            {maquinas.length} registrada{maquinas.length !== 1 ? "s" : ""}
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
        data={maquinas}
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
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
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
              <Feather name="settings" size={36} color="#2A2A2A" />
            </View>
            <Text
              style={{
                color: "#A0A0A0",
                fontSize: 16,
                fontFamily: "Inter_500Medium",
                marginBottom: 6,
              }}
            >
              No hay máquinas registradas
            </Text>
            <Text
              style={{
                color: "#555",
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                marginBottom: 24,
              }}
            >
              Agrega tu primera máquina para empezar
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
              <Feather name="plus" size={16} color="#3B82F6" />
              <Text
                style={{
                  color: "#3B82F6",
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Agregar máquina
              </Text>
            </Pressable>
          </View>
        }
      />

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
