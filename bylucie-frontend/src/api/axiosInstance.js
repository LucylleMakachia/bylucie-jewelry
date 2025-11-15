import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Optional: inject Clerk token automatically for protected routes
API.interceptors.request.use(async (config) => {
  try {
    const { getToken } = useAuth();
    const token = await getToken({ template: "default" });
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.warn("Failed to attach Clerk token:", error.message);
  }
  return config;
});

export default API;
