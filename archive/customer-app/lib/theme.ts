// JS mirror of the Tailwind brand palette, for the few places that need raw
// color values (StatusBar, ActivityIndicator, map markers, icon tints).
export const colors = {
  brand: "#0C831F",
  brandDark: "#0A6E1A",
  brandLight: "#E9FBEF",
  accent: "#FFD100",
  ink: "#111827",
  muted: "#6B7280",
  line: "#E5E7EB",
  surface: "#F6F7F9",
  white: "#FFFFFF",
  danger: "#E11D48",
};

// Env-driven config (only EXPO_PUBLIC_* is available in the bundle).
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8000/api";
export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://10.0.2.2:8000";
export const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";
