import { useState } from "react";
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
  const [imgError, setImgError] = useState(false);
  const estado = maquina.estado?.toLowerCase() || "";
  const badge = estadoConfig[estado] || { bg: "rgba(102,102,102,0.15)", text: "#999", dot: "#666", label: maquina.estado || "?" };

  const handlePress = () => {
    router.push({
      pathname: "/maquina/[id]",
      params: { id: maquina.id, data: JSON.stringify(maquina) },
    });
  };

  return (
    <View className="flex-1">
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Máquina ${maquina.nombre}, estado ${badge.label}`}
        className="active:opacity-90 active:scale-[0.98]"
      >
        <View className="bg-surface rounded-2xl overflow-hidden shadow-lg shadow-accent/5">
          {/* Image section */}
          <View className="relative">
            {maquina.imagen_url && !imgError ? (
              <Image
                source={{ uri: maquina.imagen_url }}
                className="w-full h-[130px] rounded-t-2xl"
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View className="w-full h-[100px] bg-surfaceLight items-center justify-center">
                <View className="w-11 h-11 rounded-full bg-accent/[0.08] items-center justify-center">
                  <Feather name="settings" size={20} color="#333" />
                </View>
              </View>
            )}

            {/* Estado badge floating on image */}
            <View className="absolute top-2 left-2 flex-row items-center bg-black/70 px-2 py-1 rounded-[10px] gap-1">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: badge.dot }}
              />
              <Text
                className="text-[10px] font-inter-semibold tracking-wide"
                style={{ color: badge.text }}
              >
                {badge.label}
              </Text>
            </View>
          </View>

          {/* Content section */}
          <View className="p-3 gap-1.5">
            {/* Nombre */}
            <Text
              numberOfLines={1}
              className="text-[#F0F0F0] text-[15px] font-inter-semibold tracking-tight"
            >
              {maquina.nombre}
            </Text>

            {/* Descripcion preview */}
            {maquina.descripcion ? (
              <Text
                numberOfLines={2}
                className="text-[#777] text-xs font-inter-regular leading-4"
              >
                {maquina.descripcion}
              </Text>
            ) : null}

            {/* Divider */}
            <View className="h-px bg-[#222] my-1" />

            {/* Footer info */}
            <View className="gap-1">
              {maquina.codigo ? (
                <View className="flex-row items-center gap-[5px]">
                  <Feather name="hash" size={10} color="#444" />
                  <Text
                    numberOfLines={1}
                    className="text-textMuted text-[11px] font-inter-medium"
                  >
                    {maquina.codigo}
                  </Text>
                </View>
              ) : null}

              {maquina.ubicacion ? (
                <View className="flex-row items-center gap-[5px]">
                  <Feather name="map-pin" size={10} color="#444" />
                  <Text
                    numberOfLines={1}
                    className="text-textMuted text-[11px] font-inter-medium"
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
