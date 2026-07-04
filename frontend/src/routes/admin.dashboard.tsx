import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  ScanSearch,
  ShieldAlert,
  Link2,
} from "lucide-react";
import { useDashboard } from "@/lib/queries";
import { ChainStatusBadge } from "@/components/StatusBadges";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BlockCert" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of certificates and verifications.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="border-2 border-destructive bg-card p-6 text-sm">
          Failed to load dashboard: {apiErrorMessage(error)}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={<Award className="h-5 w-5" />}
              label="Total certificates"
              value={data.totalCertificates}
              accent
            />
            <Stat
              icon={<Link2 className="h-5 w-5" />}
              label="On chain"
              value={data.onChain}
            />
            <Stat
              icon={<Clock className="h-5 w-5" />}
              label="Pending"
              value={data.pending}
            />
            <Stat
              icon={<XCircle className="h-5 w-5" />}
              label="Failed"
              value={data.failed}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <Stat
              icon={<ScanSearch className="h-5 w-5" />}
              label="Total verifications"
              value={data.totalVerifications}
            />
            <Stat
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Verified"
              value={data.verifiedCount}
            />
            <Stat
              icon={<ShieldAlert className="h-5 w-5" />}
              label="Tampered"
              value={data.tamperedCount}
            />
          </section>

          <section className="border-2 border-foreground bg-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Network
            </h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Chain ID
                </div>
                <div className="font-mono text-sm font-semibold">
                  {data.network.chainId}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Contract
                </div>
                <div className="break-all font-mono text-xs font-semibold">
                  {data.network.contractAddress || "—"}
                </div>
              </div>
            </dl>
          </section>

          <section className="border-2 border-foreground bg-card">
            <header className="flex items-center justify-between border-b-2 border-foreground p-4">
              <h2 className="text-sm font-bold uppercase tracking-widest">
                Recent certificates
              </h2>
              <Link
                to="/admin/certificates"
                className="text-xs font-semibold underline"
              >
                View all
              </Link>
            </header>
            {data.recentCertificates.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No certificates yet.
              </div>
            ) : (
              <ul className="divide-y-2 divide-border">
                {data.recentCertificates.map((c) => (
                  <li
                    key={c.certificateId}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{c.studentName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.course} · {c.department}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ChainStatusBadge status={c.verificationStatus} />
                      <Link
                        to="/admin/certificates/$id"
                        params={{ id: c.certificateId }}
                        className="inline-flex items-center gap-1 text-xs font-semibold underline"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "border-2 border-foreground bg-secondary p-5 text-secondary-foreground"
          : "border-2 border-foreground bg-card p-5"
      }
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
          {label}
        </div>
        {icon}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
    </div>
  );
}
