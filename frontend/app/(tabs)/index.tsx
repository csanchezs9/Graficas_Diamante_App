import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { api } from "../../services/api";
import { Maquina } from "../../types/maquina";
import MaquinaCard from "../../components/MaquinaCard";
import AddMaquinaModal from "../../components/AddMaquinaModal";

export default function MaquinasScreen() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchMaquinas = useCallback(async () => {
    try {
      const data = await api.getMaquinas();
      setMaquinas(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las máquinas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMaquinas();
  }, [fetchMaquinas]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaquinas();
  };

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar máquina", "¿Estás seguro de que deseas eliminarla?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteMaquina(id);
            setMaquinas((prev) => prev.filter((m) => m.id !== id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar la máquina");
          }
        },
      },
    ]);
  };

  const handleCreate = async (data: {
    nombre: string;
    descripcion: string;
    codigo: string;
    ubicacion: string;
    estado: string;
  }) => {
    const newMaquina = await api.createMaquina({
      ...data,
      imagen_url: null,
      fecha_ultima_inspeccion: null,
    });
    setMaquinas((prev) => [newMaquina, ...prev]);
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
        renderItem={({ item }) => (
          <MaquinaCard maquina={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
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
    </View>
  );
}
