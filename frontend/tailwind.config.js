/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#141414",
        surfaceLight: "#1E1E1E",
        border: "#2A2A2A",
        accent: "#3B82F6",
        accentLight: "#60A5FA",
        textPrimary: "#F5F5F5",
        textSecondary: "#A0A0A0",
        textMuted: "#666666",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        "inter-regular": ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
