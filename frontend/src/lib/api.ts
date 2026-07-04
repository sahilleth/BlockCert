import axios, { type AxiosProgressEvent } from "axios";
import type {
  AuthResponse,
  Certificate,
  DashboardStats,
  Paginated,
  User,
  VerificationResult,
} from "./types";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000/api/v1";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export const TOKEN_KEY = "blockcert_token";
export const USER_KEY = "blockcert_user";

export const assetUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith("/verify")) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        if (path.startsWith("/admin")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

const unwrap = <T,>(payload: Envelope<T> | T): T => {
  if (payload && typeof payload === "object" && "success" in (payload as object)) {
    return (payload as Envelope<T>).data;
  }
  return payload as T;
};

export const apiErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    if (!err.response && (err.code === "ERR_NETWORK" || err.message === "Network Error")) {
      return "Cannot reach the API. Make sure the backend is running (npm start) on port 5000.";
    }
    return (
      (err.response?.data as { message?: string } | undefined)?.message ??
      err.message ??
      "Request failed"
    );
  }
  return err instanceof Error ? err.message : "Something went wrong";
};

/* Endpoints */

export const login = async (body: { email: string; password: string }) => {
  const { data } = await api.post<Envelope<AuthResponse>>("/login", body);
  return unwrap(data);
};

export const getMe = async () => {
  const { data } = await api.get<Envelope<User>>("/me");
  return unwrap(data);
};

export const getDashboard = async () => {
  const { data } = await api.get<Envelope<DashboardStats>>("/dashboard");
  return unwrap(data);
};

export const getCertificates = async (params: { page?: number; limit?: number }) => {
  const { data } = await api.get<Envelope<Paginated<Certificate> | Certificate[]>>(
    "/certificates",
    { params },
  );
  const d = unwrap(data);
  if (Array.isArray(d)) {
    return {
      items: d,
      page: params.page ?? 1,
      limit: params.limit ?? d.length,
      total: d.length,
      totalPages: 1,
    } satisfies Paginated<Certificate>;
  }
  // Handle backend variations
  const anyD = d as Paginated<Certificate> & {
    certificates?: Certificate[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
  if (anyD.certificates && anyD.pagination) {
    return {
      items: anyD.certificates,
      page: anyD.pagination.page,
      limit: anyD.pagination.limit,
      total: anyD.pagination.total,
      totalPages: anyD.pagination.totalPages,
    } satisfies Paginated<Certificate>;
  }
  return d as Paginated<Certificate>;
};

export const getCertificate = async (id: string) => {
  const { data } = await api.get<Envelope<Certificate>>(`/certificate/${id}`);
  return unwrap(data);
};

export const deleteCertificate = async (id: string) => {
  const { data } = await api.delete<Envelope<{ id: string }>>(`/certificate/${id}`);
  return unwrap(data);
};

export const verifyCertificate = async (id: string) => {
  const { data } = await api.get<Envelope<VerificationResult>>(`/verify/${id}`);
  return unwrap(data);
};

export interface UploadInput {
  certificate: File;
  studentName: string;
  studentEmail?: string;
  course: string;
  department: string;
  issueDate: string;
}

export const uploadCertificate = async (
  input: UploadInput,
  onUploadProgress?: (e: AxiosProgressEvent) => void,
) => {
  const fd = new FormData();
  fd.append("certificate", input.certificate);
  fd.append("studentName", input.studentName);
  if (input.studentEmail) fd.append("studentEmail", input.studentEmail);
  fd.append("course", input.course);
  fd.append("department", input.department);
  fd.append("issueDate", input.issueDate);

  const { data } = await api.post<Envelope<Certificate>>("/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return unwrap(data);
};
