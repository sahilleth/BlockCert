import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  Upload as UploadIcon,
  X,
} from "lucide-react";

import { useCertificates } from "@/lib/queries";
import { ChainStatusBadge } from "@/components/StatusBadges";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiErrorMessage } from "@/lib/api";
import type { Certificate, VerificationStatus } from "@/lib/types";

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(10),
});

const PAGE_SIZES = [10, 25, 50, 100] as const;
const STATUS_FILTERS: Array<{ value: "ALL" | VerificationStatus; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "ON_CHAIN", label: "On chain" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
];

export const Route = createFileRoute("/admin/certificates/")({
  head: () => ({ meta: [{ title: "Certificates — BlockCert" }] }),
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { page, limit } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isLoading, isError, error, isFetching } = useCertificates(
    page,
    limit,
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | VerificationStatus>("ALL");

  const filtered = useMemo<Certificate[]>(() => {
    const items = data?.items ?? [];
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (status !== "ALL" && c.verificationStatus !== status) return false;
      if (!q) return true;
      return (
        c.studentName.toLowerCase().includes(q) ||
        c.course.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.certificateId.toLowerCase().includes(q) ||
        (c.studentEmail?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data?.items, query, status]);

  const showingRange = data
    ? {
        from: data.total === 0 ? 0 : (data.page - 1) * data.limit + 1,
        to: Math.min(data.page * data.limit, data.total),
      }
    : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Certificates</h1>
          <p className="text-sm text-muted-foreground">
            All issued certificates and their on-chain status.
          </p>
        </div>
        <Button asChild className="font-semibold">
          <Link to="/admin/upload">
            <UploadIcon className="mr-2 h-4 w-4" /> Issue new
          </Link>
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-2 border-foreground bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student, course, department, ID…"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as "ALL" | VerificationStatus)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(limit)}
          onValueChange={(v) =>
            navigate({ search: { page: 1, limit: Number(v) } })
          }
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-2 border-foreground bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="p-6 text-sm text-destructive">
            Failed to load: {apiErrorMessage(error)}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No certificates yet"
            body="Head to Upload to issue your first certificate."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No matches"
            body="Try clearing the search or status filter."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("ALL");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-foreground bg-muted text-left">
                  <tr>
                    <Th>Student</Th>
                    <Th>Course</Th>
                    <Th>Department</Th>
                    <Th>Issued</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-secondary/40"
                    >
                      <Td>
                        <div className="font-semibold">{c.studentName}</div>
                        {c.studentEmail && (
                          <div className="text-xs text-muted-foreground">
                            {c.studentEmail}
                          </div>
                        )}
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                          {c.certificateId.slice(0, 8)}…
                        </div>
                      </Td>
                      <Td>{c.course}</Td>
                      <Td>{c.department}</Td>
                      <Td className="whitespace-nowrap">{c.issueDate}</Td>
                      <Td>
                        <ChainStatusBadge status={c.verificationStatus} />
                      </Td>
                      <Td className="text-right">
                        <Link
                          to="/admin/certificates/$id"
                          params={{ id: c.certificateId }}
                          className="inline-flex items-center gap-1 rounded-md border-2 border-foreground bg-secondary px-2 py-1 text-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-foreground p-3 text-sm">
              <div className="text-xs text-muted-foreground">
                {showingRange && data.total > 0 ? (
                  <>
                    Showing <b>{showingRange.from}</b>–<b>{showingRange.to}</b>{" "}
                    of <b>{data.total}</b>
                    {query || status !== "ALL" ? (
                      <>
                        {" "}
                        · <b>{filtered.length}</b> filtered
                      </>
                    ) : null}
                    {isFetching && " · updating…"}
                  </>
                ) : (
                  <>Page {data.page} of {data.totalPages}</>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() =>
                    navigate({
                      search: { page: Math.max(1, page - 1), limit },
                    })
                  }
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="min-w-16 text-center font-mono text-xs font-bold">
                  {data.page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages || isFetching}
                  onClick={() =>
                    navigate({ search: { page: page + 1, limit } })
                  }
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center border-2 border-foreground bg-secondary">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <div className="mt-6">
        {action ?? (
          <Button asChild>
            <Link to="/admin/upload">Issue certificate</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        "px-4 py-3 text-[10px] font-bold uppercase tracking-widest " +
        (className ?? "")
      }
    >
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-4 py-3 align-top " + (className ?? "")}>{children}</td>;
}
