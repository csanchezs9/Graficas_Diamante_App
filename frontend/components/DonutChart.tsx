import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: Segment[];
  size?: number;
  strokeWidth?: number;
}

export default function DonutChart({
  data,
  size = 180,
  strokeWidth = 26,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <View className="items-center">
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#2A2A2A"
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <Text className="text-textMuted text-sm font-inter-medium mt-3">
          Sin datos
        </Text>
      </View>
    );
  }

  let accumulated = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const offset = accumulated;
    accumulated += pct;
    return { ...d, pct, offset };
  });

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#1E1E1E"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <AnimatedSegment
              key={i}
              cx={center}
              cy={center}
              r={radius}
              circumference={circumference}
              pct={seg.pct}
              offset={seg.offset}
              color={seg.color}
              strokeWidth={strokeWidth}
            />
          ))}
        </Svg>
        {/* Center text */}
        <View
          className="absolute items-center justify-center"
          style={{ width: size, height: size }}
        >
          <Text className="text-textPrimary text-2xl font-inter-bold">
            {total}
          </Text>
          <Text className="text-textMuted text-[11px] font-inter-regular">
            Total
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View className="flex-row gap-5 mt-4">
        {segments.map((seg) => (
          <View key={seg.label} className="flex-row items-center gap-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <Text className="text-textSecondary text-xs font-inter-medium">
              {seg.label}
            </Text>
            <Text className="text-textPrimary text-xs font-inter-semibold">
              {Math.round(seg.pct * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AnimatedSegment({
  cx,
  cy,
  r,
  circumference,
  pct,
  offset,
  color,
  strokeWidth,
}: {
  cx: number;
  cy: number;
  r: number;
  circumference: number;
  pct: number;
  offset: number;
  color: string;
  strokeWidth: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const dashLength = circumference * pct * progress.value;
    const gap = circumference - dashLength;
    const dashOffset = -(circumference * offset * progress.value);
    return {
      strokeDasharray: [dashLength, gap] as unknown as string,
      strokeDashoffset: dashOffset,
    };
  });

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      rotation={-90}
      origin={`${cx}, ${cy}`}
      animatedProps={animatedProps}
    />
  );
}
