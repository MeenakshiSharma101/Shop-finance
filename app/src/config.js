import { Platform } from "react-native";

const defaultPort = process.env.EXPO_PUBLIC_API_PORT || "5000";

let defaultHost = "localhost";
if (Platform.OS === "android") {
  defaultHost = "10.0.2.2";
}
if (Platform.OS === "web" && typeof window !== "undefined") {
  defaultHost = window.location.hostname || "localhost";
}

const envBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || `http://${defaultHost}:${defaultPort}`;

export const API_BASE_URLS = [envBaseUrl];

if (/^http:\/\/localhost:(5000|5001)$/.test(envBaseUrl)) {
  const alt = envBaseUrl.endsWith(":5000")
    ? "http://localhost:5001"
    : "http://localhost:5000";
  API_BASE_URLS.push(alt);
}
