const express = require("express");
const db = require("../db");

const router = express.Router();

function todayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthFromDateInput(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  return null;
}

function makeTransactionFromRow(row) {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    description: row.description,
    paymentMode: row.payment_mode,
    date: row.txn_date,
    createdAt: row.created_at,
  };
}

router.post("/", (req, res) => {
  const { amount, description, paymentMode, saleDate } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const dateValue = saleDate || todayDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return res.status(400).json({ message: "saleDate must be YYYY-MM-DD" });
  }

  const info = db
    .prepare(
      "INSERT INTO sales (user_id, amount, description, payment_mode, sale_date) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      req.user.id,
      Number(amount),
      description?.trim() || null,
      paymentMode?.trim() || "cash",
      dateValue
    );

  const created = db.prepare("SELECT * FROM sales WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json({
    transaction: {
      id: created.id,
      type: "income",
      amount: created.amount,
      description: created.description,
      paymentMode: created.payment_mode,
      date: created.sale_date,
      createdAt: created.created_at,
    },
  });
});

router.post("/expense", (req, res) => {
  const { amount, description, paymentMode, expenseDate } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const dateValue = expenseDate || todayDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return res.status(400).json({ message: "expenseDate must be YYYY-MM-DD" });
  }

  const info = db
    .prepare(
      "INSERT INTO expenses (user_id, amount, description, payment_mode, expense_date) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      req.user.id,
      Number(amount),
      description?.trim() || null,
      paymentMode?.trim() || "cash",
      dateValue
    );

  const created = db.prepare("SELECT * FROM expenses WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json({
    transaction: {
      id: created.id,
      type: "expense",
      amount: created.amount,
      description: created.description,
      paymentMode: created.payment_mode,
      date: created.expense_date,
      createdAt: created.created_at,
    },
  });
});

router.delete("/:type/:id", (req, res) => {
  const { type, id } = req.params;
  const recordId = Number(id);
  if (!Number.isInteger(recordId) || recordId <= 0) {
    return res.status(400).json({ message: "Invalid transaction id" });
  }

  if (type === "income") {
    const info = db
      .prepare("DELETE FROM sales WHERE id = ? AND user_id = ?")
      .run(recordId, req.user.id);
    if (!info.changes) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    return res.json({ success: true });
  }

  if (type === "expense") {
    const info = db
      .prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?")
      .run(recordId, req.user.id);
    if (!info.changes) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    return res.json({ success: true });
  }

  return res.status(400).json({ message: "type must be income or expense" });
});

router.get("/summary", (req, res) => {
  const selectedMonth =
    monthFromDateInput(req.query.month) ||
    monthFromDateInput(req.query.date) ||
    todayDate().slice(0, 7);

  const totalIncomeRow = db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM sales WHERE user_id = ?")
    .get(req.user.id);
  const totalExpenseRow = db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ?")
    .get(req.user.id);

  const monthlyIncomeRow = db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM sales
      WHERE user_id = ? AND strftime('%Y-%m', sale_date) = ?
      `
    )
    .get(req.user.id, selectedMonth);

  const monthlyExpenseRow = db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = ? AND strftime('%Y-%m', expense_date) = ?
      `
    )
    .get(req.user.id, selectedMonth);

  const trendIncomeRows = db
    .prepare(
      `
      SELECT sale_date AS date, ROUND(SUM(amount), 2) AS total
      FROM sales
      WHERE user_id = ? AND sale_date >= date('now', '-29 day', 'localtime')
      GROUP BY sale_date
      `
    )
    .all(req.user.id);

  const trendExpenseRows = db
    .prepare(
      `
      SELECT expense_date AS date, ROUND(SUM(amount), 2) AS total
      FROM expenses
      WHERE user_id = ? AND expense_date >= date('now', '-29 day', 'localtime')
      GROUP BY expense_date
      `
    )
    .all(req.user.id);

  const trendMap = new Map();
  for (const row of trendIncomeRows) {
    trendMap.set(row.date, { date: row.date, income: Number(row.total || 0), expense: 0 });
  }
  for (const row of trendExpenseRows) {
    const existing = trendMap.get(row.date) || {
      date: row.date,
      income: 0,
      expense: 0,
    };
    existing.expense = Number(row.total || 0);
    trendMap.set(row.date, existing);
  }
  const trend = [...trendMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      netProfit: Number((item.income - item.expense).toFixed(2)),
    }));

  const recentTransactions = db
    .prepare(
      `
      SELECT id, 'income' AS type, amount, description, payment_mode, sale_date AS txn_date, created_at
      FROM sales
      WHERE user_id = ?
      UNION ALL
      SELECT id, 'expense' AS type, amount, description, payment_mode, expense_date AS txn_date, created_at
      FROM expenses
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 40
      `
    )
    .all(req.user.id, req.user.id)
    .map(makeTransactionFromRow);

  const totalIncome = Number(totalIncomeRow.total || 0);
  const totalExpense = Number(totalExpenseRow.total || 0);
  const netProfit = Number((totalIncome - totalExpense).toFixed(2));

  const monthlyIncome = Number(monthlyIncomeRow.total || 0);
  const monthlyExpense = Number(monthlyExpenseRow.total || 0);
  const monthlyNetProfit = Number((monthlyIncome - monthlyExpense).toFixed(2));

  return res.json({
    totals: {
      totalIncome,
      totalExpense,
      netProfit,
    },
    monthly: {
      month: selectedMonth,
      income: monthlyIncome,
      expense: monthlyExpense,
      netProfit: monthlyNetProfit,
    },
    trend,
    recentTransactions,
  });
});

module.exports = router;
