import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) return Alert.alert("Validation", "Name is required");
    if (!phone.trim() && !email.trim()) {
      return Alert.alert("Validation", "Provide phone or email");
    }
    if (!password && !pin) {
      return Alert.alert("Validation", "Set password or PIN");
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        password: password || undefined,
        pin: pin || undefined,
      });
    } catch (error) {
      Alert.alert("Register failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#1B2727", "#3C5148", "#688E4E"]} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>

            <TextInput
              placeholder="Full name"
              placeholderTextColor="#B2C582"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Phone"
              placeholderTextColor="#B2C582"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              keyboardType="phone-pad"
            />
            <Text style={styles.orText}>or</Text>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#B2C582"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Password (optional)"
              placeholderTextColor="#B2C582"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              placeholder="PIN 4-6 digits (optional)"
              placeholderTextColor="#B2C582"
              value={pin}
              onChangeText={setPin}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />

            <Pressable onPress={onSubmit} disabled={submitting} style={styles.submit}>
              <Text style={styles.submitText}>
                {submitting ? "Creating account..." : "Sign Up"}
              </Text>
            </Pressable>

            <Pressable onPress={() => navigation.goBack()} style={styles.linkWrap}>
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 18 },
  card: { gap: 11 },
  cardTitle: {
    color: "#D5DDDF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "rgba(27,39,39,0.55)",
    color: "#D5DDDF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(213,221,223,0.35)",
  },
  orText: { color: "#B2C582", alignSelf: "center", fontWeight: "600" },
  submit: {
    marginTop: 8,
    backgroundColor: "#688E4E",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 13,
  },
  submitText: { color: "#D5DDDF", fontSize: 16, fontWeight: "700" },
  linkWrap: { alignItems: "center", marginTop: 6 },
  linkText: { color: "#B2C582", fontWeight: "600" },
});
