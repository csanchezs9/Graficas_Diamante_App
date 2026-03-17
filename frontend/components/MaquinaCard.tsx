import { View, Text, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Maquina } from "../types/maquina";

interface Props {
  maquina: Maquina;
  onDelete: (id: string) => void;
}

const estadoConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  "en uso": { bg: "rgba(34,197,94,0.15)", text: "#4ADE80", dot: "#22C55E", label: "En uso" },
  "no en uso": { bg: "rgba(251,191,36,0.15)", text: "#FBBF24", dot: "#F59E0B", label: "No en uso" },
};

export default function MaquinaCard({ maquina, onDelete }: Props) {
  const router = useRouter();
  const estado = maquina.estado?.toLowerCase() || "";
  const badge = estadoConfig[estado] || { bg: "rgba(102,102,102,0.15)", text: "#999", dot: "#666", label: maquina.estado || "?" };

  const handlePress = () => {
    router.push({
      pathname: "/maquina/[id]",
      params: { id: maquina.id, data: JSON.stringify(maquina) },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <View
          style={{
            backgroundColor: "#161616",
            borderRadius: 18,
            overflow: "hidden",
            // Soft shadow
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {/* Image section */}
          <View style={{ position: "relative" }}>
            {maquina.imagen_url ? (
              <Image
                source={{ uri: maquina.imagen_url }}
                style={{
                  width: "100%",
                  height: 130,
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 100,
                  backgroundColor: "#1C1C1C",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(59,130,246,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="settings" size={20} color="#333" />
                </View>
              </View>
            )}

            {/* Estado badge floating on image */}
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
                gap: 4,
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
                  fontSize: 10,
                  fontFamily: "Inter_600SemiBold",
                  letterSpacing: 0.3,
                }}
              >
                {badge.label}
              </Text>
            </View>
          </View>

          {/* Content section */}
          <View style={{ padding: 12, gap: 6 }}>
            {/* Nombre */}
            <Text
              numberOfLines={1}
              style={{
                color: "#F0F0F0",
                fontSize: 15,
                fontFamily: "Inter_600SemiBold",
                letterSpacing: -0.2,
              }}
            >
              {maquina.nombre}
            </Text>

            {/* Descripcion preview */}
            {maquina.descripcion ? (
              <Text
                numberOfLines={2}
                style={{
                  color: "#777",
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  lineHeight: 16,
                }}
              >
                {maquina.descripcion}
              </Text>
            ) : null}

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "#222",
                marginVertical: 4,
              }}
            />

            {/* Footer info */}
            <View style={{ gap: 4 }}>
              {maquina.codigo ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Feather name="hash" size={10} color="#444" />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#666",
                      fontSize: 11,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {maquina.codigo}
                  </Text>
                </View>
              ) : null}

              {maquina.ubicacion ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Feather name="map-pin" size={10} color="#444" />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#666",
                      fontSize: 11,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {maquina.ubicacion}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
