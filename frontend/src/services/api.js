import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
});

export const getPrices = () => client.get("/prices/").then((r) => r.data);
export const getTrades = (params = {}) => client.get("/trades/", { params }).then((r) => r.data);
export const getPositions = () => client.get("/positions/").then((r) => r.data);
export const getHealth = () => client.get("/health/").then((r) => r.data);
export const placeOrder = (order) => client.post("/orders/", order).then((r) => r.data);

/** Turn any axios error into a message that is safe to show a trader. */
export function errorMessage(err) {
  const data = err?.response?.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.entries(data.errors)[0];
    if (first) return `${first[0]}: ${[].concat(first[1]).join(" ")}`;
  }
  if (data?.message) return data.message;
  if (err?.code === "ECONNABORTED" || !err?.response) return "Cannot reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
