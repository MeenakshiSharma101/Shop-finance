import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatTime(value) {
  if (!value) return "";
  const safe = String(value).replace(" ", "T");
  const date = new Date(safe);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayMonth() {
  return todayDate().slice(0, 7);
}

function formatMonthLabel(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function shiftMonth(monthValue, delta) {
  const [year, month] = monthValue.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export default function DashboardScreen() {
  const { token, user, logout } = useAuth();
  const screenWidth = Dimensions.get("window").width;
  const wide = screenWidth >= 760;

  const [summary, setSummary] = useState({
    totals: { totalIncome: 0, totalExpense: 0, netProfit: 0 },
    monthly: { month: todayDate().slice(0, 7), income: 0, expense: 0, netProfit: 0 },
    trend: [],
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(todayMonth());

  const [saleAmount, setSaleAmount] = useState("");
  const [saleDescription, setSaleDescription] = useState("");
  const [salePaymentMode, setSalePaymentMode] = useState("cash");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expensePaymentMode, setExpensePaymentMode] = useState("cash");

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.getSummary(token, selectedMonth);
      setSummary(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedMonth]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const addSale = async () => {
    const amount = Number(saleAmount);
    if (!amount || amount <= 0) {
      return Alert.alert("Validation", "Enter a valid income amount");
    }
    try {
      await api.addSale(
        {
          amount,
          description: saleDescription,
          paymentMode: salePaymentMode,
          saleDate: `${selectedMonth}-01`,
        },
        token
      );
      setSaleAmount("");
      setSaleDescription("");
      await loadSummary();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const addExpense = async () => {
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) {
      return Alert.alert("Validation", "Enter a valid expense amount");
    }
    try {
      await api.addExpense(
        {
          amount,
          description: expenseDescription,
          paymentMode: expensePaymentMode,
          expenseDate: `${selectedMonth}-01`,
        },
        token
      );
      setExpenseAmount("");
      setExpenseDescription("");
      await loadSummary();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const deleteTransaction = (item) => {
    Alert.alert(
      "Delete Transaction",
      `Delete this ${item.type} entry of ${formatCurrency(item.amount)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteTransaction(item.type, item.id, token);
              await loadSummary();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={["#1B2727", "#3C5148", "#688E4E"]} style={styles.bg}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSummary} />}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Hello, {user?.name}</Text>
          </View>
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Summary</Text>
          <View style={styles.monthPickerRow}>
            <Pressable
              onPress={() => setSelectedMonth((v) => shiftMonth(v, -1))}
              style={styles.monthNavBtn}
            >
              <Text style={styles.monthNavText}>Prev</Text>
            </Pressable>
            <View style={styles.monthLabelWrap}>
              <Text style={styles.monthLabel}>{formatMonthLabel(selectedMonth)}</Text>
            </View>
            <Pressable
              onPress={() => setSelectedMonth((v) => shiftMonth(v, 1))}
              style={styles.monthNavBtn}
            >
              <Text style={styles.monthNavText}>Next</Text>
            </Pressable>
          </View>
          <Text style={styles.helperText}>
            Selected month: {summary.monthly.month}
          </Text>
          <View style={styles.monthSummaryBox}>
            <Text style={styles.monthText}>
              Income: {formatCurrency(summary.monthly.income)}
            </Text>
            <Text style={styles.monthText}>
              Expense: {formatCurrency(summary.monthly.expense)}
            </Text>
            <Text style={styles.monthText}>
              Net Profit: {formatCurrency(summary.monthly.netProfit)}
            </Text>
          </View>
        </GlassCard>

        <View style={[styles.summaryWrap, wide && styles.summaryWrapWide]}>
          <GlassCard style={[styles.metricCard, wide && styles.metricCardWide]}>
            <Text style={styles.metricLabel}>Total Income</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(summary.totals.totalIncome)}
            </Text>
          </GlassCard>
          <GlassCard style={[styles.metricCard, wide && styles.metricCardWide]}>
            <Text style={styles.metricLabel}>Total Expense</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(summary.totals.totalExpense)}
            </Text>
          </GlassCard>
          <GlassCard style={[styles.metricCard, wide && styles.metricCardWide]}>
            <Text style={styles.metricLabel}>Net Profit</Text>
            <Text style={styles.metricValue}>{formatCurrency(summary.totals.netProfit)}</Text>
          </GlassCard>
        </View>

        <View style={[styles.formsWrap, wide && styles.formsWrapWide]}>
          <GlassCard style={[styles.card, wide && styles.formCardWide]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBubble, styles.iconIncome]}>
                <Text style={styles.iconText}>+</Text>
              </View>
              <Text style={styles.cardTitle}>Add Income</Text>
            </View>
            <TextInput
              placeholder="Amount"
              placeholderTextColor="#B2C582"
              value={saleAmount}
              onChangeText={setSaleAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor="#B2C582"
              value={saleDescription}
              onChangeText={setSaleDescription}
              style={styles.input}
            />
            <View style={styles.modeWrap}>
              {["cash", "upi", "card"].map((mode) => (
                <Pressable
                  key={`sale-${mode}`}
                  onPress={() => setSalePaymentMode(mode)}
                  style={[
                    styles.modeBtn,
                    salePaymentMode === mode && styles.modeBtnActive,
                  ]}
                >
                  <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={addSale} style={styles.addBtnIncome}>
              <Text style={styles.addBtnText}>Save Income</Text>
            </Pressable>
          </GlassCard>

          <GlassCard style={[styles.card, wide && styles.formCardWide]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconBubble, styles.iconExpense]}>
                <Text style={styles.iconText}>-</Text>
              </View>
              <Text style={styles.cardTitle}>Add Expense</Text>
            </View>
            <TextInput
              placeholder="Amount"
              placeholderTextColor="#B2C582"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor="#B2C582"
              value={expenseDescription}
              onChangeText={setExpenseDescription}
              style={styles.input}
            />
            <View style={styles.modeWrap}>
              {["cash", "upi", "card"].map((mode) => (
                <Pressable
                  key={`expense-${mode}`}
                  onPress={() => setExpensePaymentMode(mode)}
                  style={[
                    styles.modeBtn,
                    expensePaymentMode === mode && styles.modeBtnActive,
                  ]}
                >
                  <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={addExpense} style={styles.addBtnExpense}>
              <Text style={styles.addBtnText}>Save Expense</Text>
            </Pressable>
          </GlassCard>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Transactions</Text>
          {summary.recentTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions recorded yet</Text>
          ) : (
            summary.recentTransactions.map((item) => (
              <View key={`${item.type}-${item.id}`} style={styles.txnItem}>
                <View style={styles.txnHeader}>
                  <Text style={styles.saleAmount}>{formatCurrency(item.amount)}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      item.type === "income" ? styles.badgeIncome : styles.badgeExpense,
                    ]}
                  >
                    <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.saleMeta}>
                  {item.date} | {formatTime(item.createdAt)} | {item.paymentMode?.toUpperCase()}
                </Text>
                {item.description ? <Text style={styles.saleDesc}>{item.description}</Text> : null}
                <Pressable
                  onPress={() => deleteTransaction(item)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },
  topBar: {
    marginTop: 22,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#D5DDDF", fontSize: 30, fontWeight: "800" },
  subtitle: { color: "#B2C582", fontSize: 14, marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(27,39,39,0.4)",
  },
  logoutText: { color: "#D5DDDF", fontWeight: "700" },
  summaryWrap: { gap: 12 },
  summaryWrapWide: { flexDirection: "row" },
  metricCard: { gap: 6 },
  metricCardWide: { flex: 1 },
  metricLabel: { color: "#B2C582", fontWeight: "600" },
  metricValue: { color: "#D5DDDF", fontWeight: "800", fontSize: 24 },
  formsWrap: { gap: 12 },
  formsWrapWide: { flexDirection: "row" },
  formCardWide: { flex: 1 },
  card: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { color: "#D5DDDF", fontSize: 18, fontWeight: "700" },
  iconBubble: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconIncome: { backgroundColor: "#3C5148" },
  iconExpense: { backgroundColor: "#B00020" },
  iconText: { color: "#D5DDDF", fontWeight: "900" },
  helperText: { color: "#B2C582", fontSize: 12 },
  monthPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthNavBtn: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: "rgba(27,39,39,0.4)",
  },
  monthNavText: { color: "#D5DDDF", fontWeight: "700" },
  monthLabelWrap: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(27,39,39,0.55)",
    borderWidth: 1,
    borderColor: "rgba(213,221,223,0.3)",
  },
  monthLabel: { color: "#D5DDDF", fontWeight: "700" },
  monthSummaryBox: {
    marginTop: 2,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "rgba(27,39,39,0.5)",
    borderWidth: 1,
    borderColor: "rgba(213,221,223,0.25)",
    gap: 6,
  },
  monthText: { color: "#D5DDDF", fontSize: 14, fontWeight: "600" },
  input: {
    backgroundColor: "rgba(27,39,39,0.55)",
    color: "#D5DDDF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(213,221,223,0.35)",
  },
  modeWrap: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(27,39,39,0.35)",
  },
  modeBtnActive: { backgroundColor: "rgba(104,142,78,0.45)" },
  modeText: { color: "#D5DDDF", fontWeight: "700", fontSize: 12 },
  addBtnIncome: {
    marginTop: 3,
    borderRadius: 12,
    backgroundColor: "#688E4E",
    alignItems: "center",
    paddingVertical: 12,
  },
  addBtnExpense: {
    marginTop: 3,
    borderRadius: 12,
    backgroundColor: "#3C5148",
    alignItems: "center",
    paddingVertical: 12,
  },
  addBtnText: { color: "#D5DDDF", fontWeight: "700", fontSize: 15 },
  txnItem: {
    borderRadius: 12,
    backgroundColor: "rgba(27,39,39,0.5)",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(213,221,223,0.25)",
    gap: 4,
  },
  txnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleAmount: { color: "#D5DDDF", fontSize: 16, fontWeight: "700" },
  saleMeta: { color: "#B2C582", marginTop: 3, fontSize: 12 },
  saleDesc: { color: "#D5DDDF", marginTop: 4, fontSize: 13 },
  typeBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeIncome: { backgroundColor: "#3C5148" },
  badgeExpense: { backgroundColor: "#B00020" },
  typeText: { color: "#D5DDDF", fontWeight: "700", fontSize: 10 },
  deleteBtn: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(27,39,39,0.45)",
  },
  deleteText: { color: "#D5DDDF", fontWeight: "700", fontSize: 12 },
  emptyText: { color: "#D5DDDF", opacity: 0.95, fontSize: 13 },
});
