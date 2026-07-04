import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  FileDown,
  Trash2,
  Link2 as LinkIcon,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { downloadAsset } from "@/lib/download";

import { useCertificate, useDeleteCertificate } from "@/lib/queries";
import { ChainStatusBadge } from "@/components/StatusBadges";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiErrorMessage, assetUrl } from "@/lib/api";

const EXPLORER = (import.meta.env.VITE_EXPLORER_URL as string | undefined) ?? "";

export const Route = createFileRoute("/admin/certificates/$id")({
  head: () => ({ meta: [{ title: "Certificate — BlockCert" }] }),
  component: CertificateDetail,
});

function CertificateDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useCertificate(id);
  const del = useDeleteCertificate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDelete = async () => {
    try {
      await del.mutateAsync(id);
      toast.success("Certificate deleted");
      navigate({ to: "/admin/certificates" });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/admin/certificates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All certificates
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError || !data ? (
        <div className="border-2 border-destructive bg-card p-6 text-sm">
          Failed to load: {apiErrorMessage(error)}
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4 border-2 border-foreground bg-card p-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Certificate
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {data.studentName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {data.course} · {data.department}
              </p>
            </div>
            <ChainStatusBadge status={data.verificationStatus} />
          </header>

          <section className="grid gap-6 border-2 border-foreground bg-card p-6 sm:grid-cols-[auto_1fr]">
            {data.qrCodeUrl && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={assetUrl(data.qrCodeUrl)}
                  alt="Certificate QR code"
                  className="h-40 w-40 border-2 border-foreground bg-white p-2"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-40"
                  onClick={() =>
                    downloadAsset(
                      data.qrCodeUrl!,
                      `blockcert-${data.certificateId}-qr.png`,
                      "QR code",
                    )
                  }
                >
                  <QrCode className="mr-2 h-4 w-4" /> Save QR
                </Button>
              </div>
            )}
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Certificate ID" value={data.certificateId} mono copyable />
              {data.studentEmail && (
                <Detail label="Student email" value={data.studentEmail} />
              )}
              <Detail label="Issue date" value={data.issueDate} />
              <Detail label="Created" value={new Date(data.createdAt).toLocaleString()} />
              <Detail label="SHA-256" value={data.sha256Hash} mono copyable full />
            </dl>
          </section>

          <section className="border-2 border-foreground bg-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Blockchain
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    <CopyButton value={data.blockchainTx} label="Tx" />
                    {EXPLORER && (
                      <a
                        href={`${EXPLORER}/tx/${data.blockchainTx}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold underline"
                      >
                        Explorer <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </dl>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/verify/$id" params={{ id: data.certificateId }}>
                <LinkIcon className="mr-2 h-4 w-4" /> Verify link
              </Link>
            </Button>
            {data.pdfUrl && (
              <Button
                variant="outline"
                onClick={() =>
                  downloadAsset(
                    data.pdfUrl!,
                    `blockcert-${data.certificateId}.pdf`,
                    "PDF",
                  )
                }
              >
                <FileDown className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            )}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="ml-auto">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this certificate?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the record from the database. The on-chain hash
                    cannot be revoked.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    disabled={del.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {del.isPending ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  copyable,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span
          className={
            "break-all text-sm font-semibold " +
            (mono ? "font-mono text-xs" : "")
          }
        >
          {value}
        </span>
        {copyable && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}
