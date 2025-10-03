import axios, { AxiosHeaders } from "axios";

const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = (envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : "/api").replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  if (config.url?.startsWith("/api") && apiClient.defaults.baseURL?.endsWith("/api")) {
    config.url = config.url.replace(/^\/api/, "");
  }

  const stored = localStorage.getItem("sales.auth");
  if (stored) {
    const state = JSON.parse(stored) as { token?: string };
    if (state.token) {
      const headers = AxiosHeaders.from(config.headers ?? {});
      headers.set("Authorization", `Bearer ${state.token}`);
      config.headers = headers;
    }
  }
  return config;
});

export default apiClient;
