import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Easing,
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
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const bgAnim = useRef(new Animated.Value(0)).current;
  const [identifier, setIdentifier] = useState("");
  const [mode, setMode] = useState("password");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!identifier.trim()) return Alert.alert("Validation", "Enter phone or email");
    if (mode === "password" && !password) return Alert.alert("Validation", "Enter password");
    if (mode === "pin" && !pin) return Alert.alert("Validation", "Enter PIN");

    setSubmitting(true);
    try {
      const payload = identifier.includes("@")
        ? { email: identifier.trim().toLowerCase() }
        : { phone: identifier.trim() };
      if (mode === "password") payload.password = password;
      else payload.pin = pin;
      await login(payload);
    } catch (error) {
      Alert.alert("Login failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bgAnim]);

  const orbOneAnim = {
    transform: [
      { translateY: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
      { translateX: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
      { rotate: "18deg" },
    ],
  };
  const orbTwoAnim = {
    transform: [
      { translateY: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
      { translateX: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      { rotate: "-12deg" },
    ],
  };
  const orbThreeAnim = {
    transform: [
      { translateY: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      { translateX: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
      { rotate: "26deg" },
    ],
  };

  return (
    <LinearGradient colors={["#1B2727", "#3C5148", "#688E4E"]} style={styles.bg}>
      <View pointerEvents="none" style={styles.bgLayer}>
        <Animated.View style={[styles.orbOne, orbOneAnim]}>
          <LinearGradient
          colors={["rgba(213,221,223,0.35)", "rgba(213,221,223,0.05)"]}
          style={styles.orbFill}
          />
        </Animated.View>
        <Animated.View style={[styles.orbTwo, orbTwoAnim]}>
          <LinearGradient
          colors={["rgba(178,197,130,0.35)", "rgba(178,197,130,0.06)"]}
          style={styles.orbFill}
          />
        </Animated.View>
        <Animated.View style={[styles.orbThree, orbThreeAnim]}>
          <LinearGradient
          colors={["rgba(27,39,39,0.45)", "rgba(27,39,39,0.1)"]}
          style={styles.orbFill}
          />
        </Animated.View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Shop Finance</Text>
            <Text style={styles.subtitle}>Track sales with clarity</Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Login</Text>

            <TextInput
              placeholder="Phone or Email"
              placeholderTextColor="#B2C582"
              value={identifier}
              onChangeText={setIdentifier}
              style={styles.input}
              autoCapitalize="none"
            />

            <View style={styles.switchWrap}>
              <Pressable
                onPress={() => setMode("password")}
                style={[styles.switchBtn, mode === "password" && styles.switchBtnActive]}
              >
                <Text style={styles.switchText}>Password</Text>
              </Pressable>
              <Pressable
                onPress={() => setMode("pin")}
                style={[styles.switchBtn, mode === "pin" && styles.switchBtnActive]}
              >
                <Text style={styles.switchText}>PIN</Text>
              </Pressable>
            </View>

            {mode === "password" ? (
              <TextInput
                placeholder="Password"
                placeholderTextColor="#B2C582"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
            ) : (
              <TextInput
                placeholder="4-6 digit PIN"
                placeholderTextColor="#B2C582"
                value={pin}
                onChangeText={setPin}
                style={styles.input}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
              />
            )}

            <Pressable onPress={onSubmit} disabled={submitting} style={styles.submit}>
              <Text style={styles.submitText}>{submitting ? "Please wait..." : "Login"}</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
              <Text style={styles.linkText}>New user? Register</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orbFill: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  orbOne: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 180,
    top: -70,
    right: -40,
    shadowColor: "#D5DDDF",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  orbTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 120,
    bottom: 120,
    left: -55,
    shadowColor: "#B2C582",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
  orbThree: {
    position: "absolute",
    width: 290,
    height: 290,
    borderRadius: 200,
    bottom: -150,
    right: -90,
    shadowColor: "#1B2727",
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  header: { marginBottom: 18 },
  title: {
    color: "#D5DDDF",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#B2C582",
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    gap: 12,
  },
  cardTitle: {
    color: "#D5DDDF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
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
  switchWrap: { flexDirection: "row", gap: 8 },
  switchBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(27,39,39,0.35)",
  },
  switchBtnActive: {
    backgroundColor: "rgba(104,142,78,0.45)",
  },
  switchText: { color: "#D5DDDF", fontWeight: "600" },
  submit: {
    marginTop: 4,
    backgroundColor: "#688E4E",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 13,
  },
  submitText: { color: "#D5DDDF", fontSize: 16, fontWeight: "700" },
  linkWrap: { alignItems: "center", marginTop: 6 },
  linkText: { color: "#B2C582", fontWeight: "600" },
});
