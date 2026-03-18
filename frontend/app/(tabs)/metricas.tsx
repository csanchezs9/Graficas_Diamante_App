import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { api } from "../../services/api";
import { Maquina } from "../../types/maquina";
import { Mantenimiento } from "../../types/mantenimiento";
import { Repuesto } from "../../types/repuesto";
import { useToast } from "../../context/ToastContext";
import { MetricasSkeleton } from "../../components/Skeleton";
import DonutChart from "../../components/DonutChart";
import MetricCard from "../../components/MetricCard";
import { generatePDFReport } from "../../utils/generateReport";

function formatMoney(value: number): string {
  return "$" + value.toLocaleString("es-CO");
}

export default function MetricasScreen() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [maq, mant, rep] = await Promise.all([
        api.getMaquinas(),
        api.getMantenimientos(),
        api.getRepuestos(),
      ]);
      setMaquinas(maq);
      setMantenimientos(mant);
      setRepuestos(rep);
    } catch {
      showToast("error", "No se pudieron cargar las metricas");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData().finally(() => setLoading(false));
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Computed metrics
  const preventivos = useMemo(
    () => mantenimientos.filter((m) => m.tipo === "preventivo").length,
    [mantenimientos]
  );
  const correctivos = useMemo(
    () => mantenimientos.filter((m) => m.tipo === "correctivo").length,
    [mantenimientos]
  );
  const totalCostoMant = useMemo(
    () => mantenimientos.reduce((sum, m) => sum + (m.costo_total || 0), 0),
    [mantenimientos]
  );
  const totalCostoRep = useMemo(
    () =>
      repuestos.reduce(
        (sum, r) => sum + (r.costo_unitario || 0) * (r.cantidad_disponible || 0),
        0
      ),
    [repuestos]
  );

  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    try {
      await generatePDFReport(maquinas, mantenimientos, repuestos);
    } catch {
      showToast("error", "No se pudo generar el reporte");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View className="px-5 pt-12 pb-4">
        <Text className="text-textPrimary text-[26px] font-inter-bold">
          Metricas
        </Text>
        <Text className="text-textMuted text-sm font-inter-regular mt-0.5">
          Dashboard y reportes
        </Text>
      </View>

      {loading ? (
        <MetricasSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
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
        >
          {/* Donut Chart */}
          <View className="bg-surface border-[0.5px] border-border rounded-2xl p-5 mb-4">
            <Text className="text-textSecondary text-xs font-inter-medium uppercase tracking-widest mb-4">
              Distribucion de Mantenimientos
            </Text>
            <DonutChart
              data={[
                {
                  label: "Preventivo",
                  value: preventivos,
                  color: "#3B82F6",
                },
                {
                  label: "Correctivo",
                  value: correctivos,
                  color: "#F59E0B",
                },
              ]}
            />
          </View>

          {/* Money Cards Row 1 */}
          <View className="flex-row gap-3 mb-3">
            <MetricCard
              title="Mantenimientos"
              value={formatMoney(totalCostoMant)}
              icon="tool"
              subtitle={`${mantenimientos.length} registros`}
              accentColor="#3B82F6"
            />
            <MetricCard
              title="Repuestos"
              value={formatMoney(totalCostoRep)}
              icon="package"
              subtitle={`${repuestos.length} registros`}
              accentColor="#22C55E"
            />
          </View>

          {/* Extra Stats Row */}
          <View className="flex-row gap-3 mb-6">
            <MetricCard
              title="Maquinas"
              value={String(maquinas.length)}
              icon="settings"
              subtitle={
                maquinas.filter((m) => m.estado?.toLowerCase() === "en uso")
                  .length + " en uso"
              }
              accentColor="#A78BFA"
            />
            <MetricCard
              title="Costo Total"
              value={formatMoney(totalCostoMant + totalCostoRep)}
              icon="dollar-sign"
              subtitle="Mant. + Repuestos"
              accentColor="#F59E0B"
            />
          </View>

          {/* PDF Report Button */}
          <Pressable
            onPress={handleGeneratePDF}
            disabled={generatingPdf}
            accessibilityRole="button"
            accessibilityLabel="Generar reporte PDF"
            className={`bg-accent py-4 rounded-2xl flex-row items-center justify-center gap-2.5 active:scale-[0.98] ${
              generatingPdf ? "opacity-70" : ""
            }`}
          >
            {generatingPdf ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Feather name="file-text" size={18} color="#FFF" />
                <Text className="text-white text-base font-inter-semibold">
                  Generar Reporte PDF
                </Text>
              </>
            )}
          </Pressable>

          <Text className="text-textMuted text-[11px] font-inter-regular text-center mt-2.5">
            Reporte completo con mantenimientos y repuestos por maquina
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
