import { API_BASE_URLS } from "../config";

async function request(path, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }
      return data;
    } catch (error) {
      lastError = error;
      const isNetworkError =
        error?.name === "TypeError" ||
        /network request failed/i.test(String(error?.message || ""));
      if (!isNetworkError) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Request failed");
}

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  addSale: (payload, token) =>
    request(
      "/api/sales",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token
    ),
  addExpense: (payload, token) =>
    request(
      "/api/sales/expense",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token
    ),
  deleteTransaction: (type, id, token) =>
    request(`/api/sales/${type}/${id}`, { method: "DELETE" }, token),
  getSummary: (token, dateOrMonth) => {
    const query = dateOrMonth
      ? `?date=${encodeURIComponent(dateOrMonth)}`
      : "";
    return request(`/api/sales/summary${query}`, {}, token);
  },
};
