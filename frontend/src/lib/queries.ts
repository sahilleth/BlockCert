import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { AxiosProgressEvent } from "axios";
import {
  deleteCertificate,
  getCertificate,
  getCertificates,
  getDashboard,
  login,
  uploadCertificate,
  verifyCertificate,
  type UploadInput,
} from "./api";
import type { AuthResponse, Certificate } from "./types";

export const qk = {
  dashboard: ["dashboard"] as const,
  certificates: (page: number, limit: number) =>
    ["certificates", { page, limit }] as const,
  certificate: (id: string) => ["certificate", id] as const,
  verify: (id: string) => ["verify", id] as const,
};

export const useLogin = (
  options?: UseMutationOptions<AuthResponse, unknown, { email: string; password: string }>,
) =>
  useMutation({
    mutationFn: (body: { email: string; password: string }) => login(body),
    ...options,
  });

export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: getDashboard });

export const useCertificates = (page: number, limit: number) =>
  useQuery({
    queryKey: qk.certificates(page, limit),
    queryFn: () => getCertificates({ page, limit }),
  });

export const useCertificate = (id: string | undefined) =>
  useQuery({
    queryKey: qk.certificate(id ?? ""),
    queryFn: () => getCertificate(id as string),
    enabled: !!id,
  });

export const useVerify = (id: string | undefined) =>
  useQuery({
    queryKey: qk.verify(id ?? ""),
    queryFn: () => verifyCertificate(id as string),
    enabled: !!id,
    retry: 1,
  });

export const useUploadCertificate = (
  onProgress?: (e: AxiosProgressEvent) => void,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadInput) => uploadCertificate(input, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
};

export const useDeleteCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCertificate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificates"] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
};

export type { Certificate };
