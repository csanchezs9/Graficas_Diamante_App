import { useEffect } from "react";
import { DimensionValue, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface SkeletonProps {
  className?: string;
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}

export default function Skeleton({
  className = "",
  width,
  height,
  borderRadius,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-surfaceLight ${className}`}
      style={[
        animatedStyle,
        width !== undefined ? { width } : undefined,
        height !== undefined ? { height } : undefined,
        borderRadius !== undefined ? { borderRadius } : undefined,
      ]}
    />
  );
}

// --- Skeleton Screens ---

export function MaquinasListSkeleton() {
  return (
    <View className="flex-row flex-wrap px-[10px] gap-1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="w-[49%] bg-surface rounded-2xl overflow-hidden mb-1">
          <Skeleton className="w-full" height={110} borderRadius={0} />
          <View className="p-3 gap-2">
            <Skeleton className="w-3/4" height={14} borderRadius={6} />
            <Skeleton className="w-full" height={10} borderRadius={4} />
            <Skeleton className="w-1/2" height={10} borderRadius={4} />
            <View className="h-px bg-[#222] my-0.5" />
            <Skeleton className="w-2/3" height={9} borderRadius={4} />
            <Skeleton className="w-1/2" height={9} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function MantenimientosListSkeleton() {
  return (
    <View className="pt-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          className="bg-surface border-[0.5px] border-border rounded-2xl p-3.5 mx-5 mb-2.5"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Skeleton className="flex-1 mr-3" height={16} borderRadius={6} />
            <Skeleton width={70} height={20} borderRadius={8} />
          </View>
          <Skeleton className="w-full mb-1" height={11} borderRadius={4} />
          <Skeleton className="w-2/3 mb-3" height={11} borderRadius={4} />
          <View className="flex-row justify-between">
            <Skeleton width={100} height={11} borderRadius={4} />
            <Skeleton width={120} height={11} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function RepuestosListSkeleton() {
  return (
    <View className="pt-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          className="bg-surface border-[0.5px] border-border rounded-2xl p-3.5 mx-5 mb-2.5"
        >
          <View className="flex-row items-center mb-3">
            <Skeleton width={38} height={38} borderRadius={10} />
            <View className="flex-1 ml-3 mr-2 gap-1">
              <Skeleton className="w-3/4" height={14} borderRadius={6} />
            </View>
            <Skeleton width={60} height={18} borderRadius={8} />
          </View>
          <Skeleton className="w-full mb-3" height={28} borderRadius={8} />
          <View className="flex-row items-center gap-4">
            <Skeleton width={55} height={11} borderRadius={4} />
            <Skeleton width={55} height={11} borderRadius={4} />
            <Skeleton width={70} height={11} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DetailSkeleton({ hasImage = true }: { hasImage?: boolean }) {
  return (
    <View>
      {hasImage && <Skeleton className="w-full" height={220} borderRadius={0} />}
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-5">
          <Skeleton className="flex-1 mr-3" height={24} borderRadius={8} />
          <Skeleton width={90} height={28} borderRadius={20} />
        </View>

        <Skeleton className="w-full mb-2" height={12} borderRadius={4} />
        <Skeleton className="w-4/5 mb-5" height={12} borderRadius={4} />

        <View className="gap-2.5 mb-5">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="flex-row items-center bg-surface border-[0.5px] border-border rounded-2xl px-4 py-3.5 gap-3"
            >
              <Skeleton width={36} height={36} borderRadius={10} />
              <View className="flex-1 gap-1.5">
                <Skeleton className="w-1/3" height={9} borderRadius={3} />
                <Skeleton className="w-2/3" height={13} borderRadius={5} />
              </View>
            </View>
          ))}
        </View>

        <Skeleton className="w-full" height={48} borderRadius={16} />
        <View className="mt-2.5">
          <Skeleton className="w-full" height={48} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}
