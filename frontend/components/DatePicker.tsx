import { Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface DatePickerProps {
  value: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  maximumDate?: Date;
}

export default function DatePicker({ value, onChange, maximumDate }: DatePickerProps) {
  if (Platform.OS === "web") {
    const maxStr = maximumDate
      ? maximumDate.toISOString().split("T")[0]
      : undefined;

    return (
      <input
        type="date"
        value={value.toISOString().split("T")[0]}
        max={maxStr}
        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
        onChange={(e) => {
          const date = new Date(e.target.value + "T12:00:00");
          if (!isNaN(date.getTime())) {
            onChange({ type: "set", nativeEvent: { timestamp: date.getTime() } } as DateTimePickerEvent, date);
          }
        }}
        style={{
          backgroundColor: "#1E1E1E",
          color: "#F5F5F5",
          border: "1px solid #2A2A2A",
          borderRadius: 12,
          padding: "10px 14px",
          fontSize: 15,
          fontFamily: "Inter_400Regular, sans-serif",
          width: "100%",
          outline: "none",
          colorScheme: "dark",
        }}
      />
    );
  }

  return (
    <DateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === "ios" ? "spinner" : "default"}
      onChange={onChange}
      maximumDate={maximumDate}
      themeVariant="dark"
    />
  );
}
