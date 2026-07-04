export type UserRole = "ADMIN" | "EMPLOYER";
export type VerificationStatus = "PENDING" | "ON_CHAIN" | "FAILED";
export type VerifyResult = "VERIFIED" | "TAMPERED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Certificate {
  id: string;
  certificateId: string;
  studentName: string;
  studentEmail?: string | null;
  course: string;
  department: string;
  issueDate: string;
  sha256Hash: string;
  pdfUrl?: string;
  blockchainTx?: string | null;
  contractAddress?: string | null;
  walletAddress?: string | null;
  verificationStatus: VerificationStatus;
  verificationUrl?: string;
  qrCodeUrl?: string;
  createdAt: string;
}

export interface VerificationResult {
  certificateId: string;
  studentName: string;
  studentEmail?: string | null;
  course: string;
  department: string;
  issueDate: string;
  status: VerifyResult;
  message: string;
  onChain: boolean;
  hashAudit: {
    recalculatedHash: string | null;
    storedHash: string;
    blockchainHash: string | null;
    hashMatchesChain: boolean;
    hashMatchesStored: boolean;
    pdfAvailable: boolean;
  };
  blockchainTx?: string | null;
  contractAddress?: string | null;
  walletAddress?: string | null;
  verifiedAt: string;
  verificationHistory: Array<{
    id: string;
    result: VerifyResult;
    verifiedByIp: string | null;
    verifiedTime: string;
  }>;
}

export interface DashboardStats {
  totalCertificates: number;
  onChain: number;
  pending: number;
  failed: number;
  totalVerifications: number;
  verifiedCount: number;
  tamperedCount: number;
  network: { chainId: number; contractAddress: string };
  recentCertificates: Array<{
    certificateId: string;
    studentName: string;
    course: string;
    department: string;
    verificationStatus: VerificationStatus;
    createdAt: string;
    qrCodeUrl: string;
  }>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
