import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, FileText, X, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { apiErrorMessage, assetUrl } from "@/lib/api";
import { useUploadCertificate } from "@/lib/queries";
import type { Certificate } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/upload")({
  head: () => ({ meta: [{ title: "Issue certificate — BlockCert" }] }),
  component: UploadPage,
});

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const NAME_RE = /^[\p{L}\p{M}\s.'\-,]+$/u;

const today = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "Enter the student's full name")
    .max(120, "Too long (max 120 characters)")
    .regex(NAME_RE, "Only letters, spaces, apostrophes and hyphens"),
  studentEmail: z
    .string()
    .trim()
    .max(255, "Too long")
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  course: z
    .string()
    .trim()
    .min(2, "Course is required")
    .max(160, "Too long (max 160 characters)"),
  department: z
    .string()
    .trim()
    .min(2, "Department is required")
    .max(160, "Too long (max 160 characters)"),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD")
    .refine((d) => {
      const t = new Date(d).getTime();
      return !Number.isNaN(t);
    }, "Invalid date")
    .refine((d) => d <= today(), "Issue date cannot be in the future")
    .refine((d) => {
      const year = Number(d.slice(0, 4));
      return year >= 1950;
    }, "Issue date is too far in the past"),
});
type FormData = z.infer<typeof schema>;

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [issued, setIssued] = useState<Certificate | null>(null);

  const uploadM = useUploadCertificate((e) => {
    if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentName: "",
      studentEmail: "",
      course: "",
      department: "",
      issueDate: new Date().toISOString().slice(0, 10),
    },
  });

  const pickFile = useCallback(async (f: File | null | undefined) => {
    if (!f) return;
    const isPdfMime = f.type === "application/pdf";
    const isPdfExt = /\.pdf$/i.test(f.name);
    if (!isPdfMime && !isPdfExt) {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (f.size === 0) {
      toast.error("That file is empty");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast.error(
        `File too large — max ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB`,
      );
      return;
    }
    // Magic byte check: PDF files start with "%PDF-"
    try {
      const head = new Uint8Array(await f.slice(0, 5).arrayBuffer());
      const sig = String.fromCharCode(...head);
      if (sig !== "%PDF-") {
        toast.error("File is not a valid PDF");
        return;
      }
    } catch {
      // If slicing fails, still allow — server will re-validate
    }
    setFile(f);
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!file) {
      toast.error("Attach a PDF certificate");
      return;
    }
    setProgress(0);
    try {
      const cert = await uploadM.mutateAsync({
        certificate: file,
        studentName: values.studentName,
        studentEmail: values.studentEmail || undefined,
        course: values.course,
        department: values.department,
        issueDate: values.issueDate,
      });
      toast.success("Certificate issued");
      setIssued(cert);
      setFile(null);
      form.reset({
        studentName: "",
        studentEmail: "",
        course: "",
        department: "",
        issueDate: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setProgress(0);
    }
  });

  if (issued) {
    return <SuccessView cert={issued} onIssueAnother={() => setIssued(null)} />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Issue certificate</h1>
        <p className="text-sm text-muted-foreground">
          Upload a signed PDF; we'll hash it and anchor it on chain.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6 border-2 border-foreground bg-card p-6">
        {/* File drop */}
        <div>
          <Label>Certificate PDF</Label>
          <label
            htmlFor="pdf"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "mt-1 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center transition-colors",
              dragOver
                ? "border-primary bg-secondary"
                : "border-foreground bg-muted hover:bg-secondary",
            )}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                <div className="text-left">
                  <div className="text-sm font-semibold">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8" />
                <div className="mt-3 text-sm font-semibold">
                  Drag & drop a PDF or click to browse
                </div>
                <div className="text-xs text-muted-foreground">
                  PDF only · max {(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB
                </div>
              </>
            )}
            <input
              id="pdf"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="studentName">Student name *</Label>
            <Input id="studentName" {...form.register("studentName")} />
            {form.formState.errors.studentName && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.studentName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="studentEmail">Student email</Label>
            <Input
              id="studentEmail"
              type="email"
              {...form.register("studentEmail")}
            />
            {form.formState.errors.studentEmail && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.studentEmail.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="course">Course *</Label>
            <Input id="course" {...form.register("course")} />
            {form.formState.errors.course && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.course.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="department">Department *</Label>
            <Input id="department" {...form.register("department")} />
            {form.formState.errors.department && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.department.message}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="issueDate">Issue date *</Label>
            <Input id="issueDate" type="date" {...form.register("issueDate")} />
            {form.formState.errors.issueDate && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.issueDate.message}
              </p>
            )}
          </div>
        </div>

        {uploadM.isPending && (
          <div
            role="status"
            aria-live="polite"
            className="border-2 border-foreground bg-secondary p-4"
          >
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {progress < 100 ? "Uploading PDF" : "Anchoring on chain"}
              </span>
              <span className="font-mono">
                {progress < 100 ? `${progress}%` : "Please wait…"}
              </span>
            </div>
            {progress < 100 ? (
              <Progress value={progress} />
            ) : (
              <div className="h-2 w-full overflow-hidden bg-muted">
                <div className="h-full w-1/3 animate-[indeterminate_1.4s_infinite_linear] bg-primary" />
              </div>
            )}
            <p className="mt-2 text-[11px] text-secondary-foreground/80">
              {progress < 100
                ? `Transferring ${file ? (file.size / 1024).toFixed(1) : "0"} KB…`
                : "Computing SHA-256 and writing to the blockchain. This can take 5–30 seconds."}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full font-semibold"
          size="lg"
          disabled={uploadM.isPending || !file}
        >
          {uploadM.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {progress < 100 ? "Uploading…" : "Anchoring…"}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Issue certificate
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function SuccessView({
  cert,
  onIssueAnother,
}: {
  cert: Certificate;
  onIssueAnother: () => void;
}) {
  const qr = assetUrl(cert.qrCodeUrl);
  const verifyPath = `/verify/${cert.certificateId}`;
  return (
    <div className="max-w-3xl space-y-6">
      <div className="border-4 border-success bg-success p-6 text-success-foreground">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8" />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">
              Success
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Certificate issued
            </h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-2 border-foreground bg-card p-6 sm:grid-cols-[auto_1fr]">
        {qr && (
          <img
            src={qr}
            alt="Certificate QR code"
            className="h-40 w-40 border-2 border-foreground bg-white p-2"
          />
        )}
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Student
            </div>
            <div className="font-semibold">{cert.studentName}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Certificate ID
            </div>
            <div className="break-all font-mono text-xs">{cert.certificateId}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Verify URL
            </div>
            <div className="break-all font-mono text-xs">{verifyPath}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/admin/certificates/$id" params={{ id: cert.certificateId }}>
            <Eye className="mr-2 h-4 w-4" /> View details
          </Link>
        </Button>
        <Button onClick={onIssueAnother}>Issue another</Button>
      </div>
    </div>
  );
}
