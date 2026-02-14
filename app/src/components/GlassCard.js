import { View, StyleSheet } from "react-native";

export default function GlassCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(213,221,223,0.18)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(213,221,223,0.35)",
    padding: 16,
  },
});
