import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  Printer,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PublicNav } from "@/components/PublicNav";
import { VerifyResultBadge } from "@/components/StatusBadges";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVerify } from "@/lib/queries";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const EXPLORER = (import.meta.env.VITE_EXPLORER_URL as string | undefined) ?? "";

export const Route = createFileRoute("/verify/$id")({
  head: () => ({
    meta: [
      { title: "Certificate verification — BlockCert" },
      { name: "description", content: "Blockchain-verified certificate audit." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyResultPage,
});

function VerifyResultPage() {
  const { id } = Route.useParams();
  const { data, isLoading, isError, error, refetch, isFetching } = useVerify(id);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          to="/verify"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Verify another
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError || !data ? (
          <div className="border-2 border-destructive bg-card p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="mt-4 text-xl font-bold">Could not verify certificate</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {apiErrorMessage(error)}
            </p>
            <Button className="mt-6" onClick={() => refetch()} disabled={isFetching}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status banner */}
            <div
              className={cn(
                "border-4 p-8",
                data.status === "VERIFIED"
                  ? "border-success bg-success text-success-foreground"
                  : "border-destructive bg-destructive text-destructive-foreground",
              )}
            >
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  {data.status === "VERIFIED" ? (
                    <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
                  ) : (
                    <X className="h-12 w-12" strokeWidth={3} />
                  )}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                      Verification result
                    </div>
                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                      {data.message}
                    </h1>
                  </div>
                </div>
                <VerifyResultBadge result={data.status} />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const url = window.location.href;
                  const shareData = {
                    title: `BlockCert — ${data.studentName}`,
                    text: `${data.message} · ${data.course}`,
                    url,
                  };
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                    } catch {
                      /* user canceled */
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(url);
                      toast.success("Link copied to clipboard");
                    } catch {
                      toast.error("Could not copy link");
                    }
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied");
                  } catch {
                    toast.error("Could not copy link");
                  }
                }}
              >
                <LinkIcon className="mr-2 h-4 w-4" /> Copy link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>

            {/* Cert details */}
            <section className="border-2 border-foreground bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Certificate
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail label="Student" value={data.studentName} />
                {data.studentEmail && (
                  <Detail label="Student email" value={data.studentEmail} />
                )}
                <Detail label="Course" value={data.course} />
                <Detail label="Department" value={data.department} />
                <Detail label="Issue date" value={data.issueDate} />
                <Detail
                  label="Certificate ID"
                  value={data.certificateId}
                  mono
                  copyable
                />
              </dl>
            </section>

            {/* Hash audit */}
            <section className="border-2 border-foreground bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Hash comparison
              </h2>
              <div className="mt-4 space-y-3">
                <HashRow
                  label="Stored hash"
                  value={data.hashAudit.storedHash}
                  matches={data.hashAudit.hashMatchesStored}
                />
                <HashRow
                  label="Recalculated from PDF"
                  value={data.hashAudit.recalculatedHash}
                  matches={data.hashAudit.hashMatchesStored}
                  fallback={
                    data.hashAudit.pdfAvailable
                      ? "Not recalculated"
                      : "PDF not available"
                  }
                />
                <HashRow
                  label="Blockchain hash"
                  value={data.hashAudit.blockchainHash}
                  matches={data.hashAudit.hashMatchesChain}
                  fallback="Not on chain"
                />
              </div>
            </section>

            {/* Blockchain info */}
            <section className="border-2 border-foreground bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Blockchain
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail
                  label="On chain"
                  value={data.onChain ? "Yes" : "No"}
                />
                {data.contractAddress && (
                  <Detail label="Contract" value={data.contractAddress} mono copyable />
                )}
                {data.walletAddress && (
                  <Detail label="Signer wallet" value={data.walletAddress} mono copyable />
                )}
                {data.blockchainTx && (
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Transaction hash
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-xs">
                        {data.blockchainTx}
                      </span>
                      <CopyButton value={data.blockchainTx} label="Tx hash" />
                      {EXPLORER && (
                        <a
                          href={`${EXPLORER}/tx/${data.blockchainTx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
                        >
                          Explorer <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </dl>
            </section>

            {/* History */}
            <section className="border-2 border-foreground bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Verification history
              </h2>
              {data.verificationHistory.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No previous verification attempts.
                </p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {data.verificationHistory.map((h) => (
                    <li
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-l-4 border-foreground bg-muted px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <VerifyResultBadge result={h.result} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.verifiedTime).toLocaleString()}
                        </span>
                      </div>
                      {h.verifiedByIp && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {h.verifiedByIp}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <p className="text-center text-xs text-muted-foreground">
              Verified at {new Date(data.verifiedAt).toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "break-all text-sm font-semibold",
            mono && "font-mono text-xs",
          )}
        >
          {value}
        </span>
        {copyable && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}

function HashRow({
  label,
  value,
  matches,
  fallback,
}: {
  label: string;
  value: string | null | undefined;
  matches: boolean;
  fallback?: string;
}) {
  return (
    <div className="border-2 border-border bg-muted p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </span>
        <span
          className={cn(
            "border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
            matches
              ? "border-success bg-success text-success-foreground"
              : "border-destructive bg-destructive text-destructive-foreground",
          )}
        >
          {matches ? "Match" : "Mismatch"}
        </span>
      </div>
      <div className="mt-2 break-all font-mono text-xs">
        {value ?? fallback ?? "—"}
      </div>
    </div>
  );
}
