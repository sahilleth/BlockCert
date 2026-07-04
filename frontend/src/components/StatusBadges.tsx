import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VerificationStatus, VerifyResult } from "@/lib/types";

export function ChainStatusBadge({ status }: { status: VerificationStatus }) {
  const map: Record<VerificationStatus, string> = {
    ON_CHAIN: "bg-primary text-primary-foreground border-primary",
    PENDING: "bg-warning text-warning-foreground border-warning",
    FAILED: "bg-destructive text-destructive-foreground border-destructive",
  };
  const label: Record<VerificationStatus, string> = {
    ON_CHAIN: "On Chain",
    PENDING: "Pending",
    FAILED: "Failed",
  };
  return (
    <Badge className={cn("border font-semibold uppercase tracking-wide", map[status])}>
      {label[status]}
    </Badge>
  );
}

export function VerifyResultBadge({ result }: { result: VerifyResult }) {
  const map: Record<VerifyResult, string> = {
    VERIFIED: "bg-success text-success-foreground border-success",
    TAMPERED: "bg-destructive text-destructive-foreground border-destructive",
  };
  return (
    <Badge className={cn("border font-semibold uppercase tracking-wide", map[result])}>
      {result}
    </Badge>
  );
}
