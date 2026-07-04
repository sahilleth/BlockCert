export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type VerificationStatus = "VERIFIED" | "TAMPERED";

export interface VerificationResult {
  certificateId: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  status: VerificationStatus;
  onChain: boolean;
  txHash: string | null;
  blockNumber: number | null;
  contractAddress: string | null;
  verifiedAt: string;
}
