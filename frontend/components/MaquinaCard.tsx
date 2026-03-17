import { View, Text, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Maquina } from "../types/maquina";

interface Props {
  maquina: Maquina;
  onDelete: (id: string) => void;
}

const estadoConfig: Record<string, { bg: string; text: string; dot: string }> = {
  activa: { bg: "rgba(34,197,94,0.12)", text: "#22C55E", dot: "#22C55E" },
  inactiva: { bg: "rgba(245,158,11,0.12)", text: "#F59E0B", dot: "#F59E0B" },
  mantenimiento: { bg: "rgba(239,68,68,0.12)", text: "#EF4444", dot: "#EF4444" },
};

export default function MaquinaCard({ maquina, onDelete }: Props) {
  const estado = maquina.estado?.toLowerCase() || "";
  const badge = estadoConfig[estado] || { bg: "rgba(102,102,102,0.12)", text: "#666", dot: "#666" };

  return (
    <View
      style={{
        backgroundColor: "#141414",
        borderWidth: 1,
        borderColor: "#2A2A2A",
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {maquina.imagen_url ? (
        <Image
          source={{ uri: maquina.imagen_url }}
          style={{ width: "100%", height: 160 }}
          resizeMode="cover"
        />
      ) : null}

      <View style={{ padding: 16 }}>
        {/* Row: nombre + badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: "#F5F5F5",
              fontSize: 17,
              fontFamily: "Inter_600SemiBold",
              flex: 1,
              marginRight: 10,
            }}
          >
            {maquina.nombre}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: badge.bg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              gap: 6,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: badge.dot,
              }}
            />
            <Text
              style={{
                color: badge.text,
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                textTransform: "capitalize",
              }}
            >
              {maquina.estado}
            </Text>
          </View>
        </View>

        {/* Descripcion */}
        {maquina.descripcion ? (
          <Text
            numberOfLines={2}
            style={{
              color: "#A0A0A0",
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            {maquina.descripcion}
          </Text>
        ) : null}

        {/* Info chips */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          {maquina.codigo ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#1E1E1E",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Feather name="hash" size={12} color="#666" />
              <Text
                style={{
                  color: "#A0A0A0",
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {maquina.codigo}
              </Text>
            </View>
          ) : null}
          {maquina.ubicacion ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#1E1E1E",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Feather name="map-pin" size={12} color="#666" />
              <Text
                style={{
                  color: "#A0A0A0",
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {maquina.ubicacion}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer: inspección + delete */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopColor: "#1E1E1E",
            paddingTop: 12,
          }}
        >
          <Text
            style={{
              color: "#555",
              fontSize: 12,
              fontFamily: "Inter_400Regular",
            }}
          >
            {maquina.fecha_ultima_inspeccion
              ? `Inspección: ${new Date(maquina.fecha_ultima_inspeccion).toLocaleDateString()}`
              : "Sin inspección registrada"}
          </Text>
          <Pressable
            onPress={() => onDelete(maquina.id)}
            hitSlop={12}
            style={{
              padding: 8,
              borderRadius: 10,
              backgroundColor: "rgba(239,68,68,0.08)",
            }}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
