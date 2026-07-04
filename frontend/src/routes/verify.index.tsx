import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QrCode, Search, ClipboardPaste, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Verify a Certificate — BlockCert" },
      {
        name: "description",
        content: "Verify the authenticity of any BlockCert certificate.",
      },
    ],
  }),
  component: VerifyEntry,
});

function VerifyEntry() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = id.trim();
  const isValid = UUID_RE.test(trimmed);
  const showError = touched && trimmed.length > 0 && !isValid;

  const submit = () => {
    if (!isValid) {
      setTouched(true);
      return;
    }
    navigate({ to: "/verify/$id", params: { id: trimmed } });
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.trim();
      setId(clean);
      setTouched(true);
      if (UUID_RE.test(clean)) {
        toast.success("Valid certificate ID pasted");
      }
    } catch {
      toast.error("Clipboard access blocked");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 border-2 border-foreground bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest">
            <QrCode className="h-3.5 w-3.5" /> Employer verification
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Verify a certificate
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter the certificate ID or scan the QR code with your phone camera.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            submit();
          }}
          className="border-2 border-foreground bg-card p-6"
        >
          <div className="flex items-center justify-between">
            <label htmlFor="cert-id" className="text-sm font-semibold">
              Certificate ID
            </label>
            <button
              type="button"
              onClick={pasteFromClipboard}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="cert-id"
              ref={inputRef}
              placeholder="8f1a2c9e-4d3b-4a7f-9e1c-8b2d1e3a5c7f"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onBlur={() => setTouched(true)}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={showError}
              aria-describedby="cert-id-hint"
              className={cn(
                "font-mono",
                showError && "border-destructive focus-visible:ring-destructive",
              )}
            />
            <Button
              type="submit"
              className="font-semibold"
              disabled={!trimmed || (touched && !isValid)}
            >
              <Search className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </div>

          <div id="cert-id-hint" className="mt-2 min-h-[1.25rem] text-xs">
            {showError ? (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                That doesn't look like a valid certificate ID (UUID format).
              </span>
            ) : (
              <span className="text-muted-foreground">
                Format: 8-4-4-4-12 hex characters
              </span>
            )}
          </div>

          <div className="mt-4 border-t-2 border-dashed border-border pt-3 text-xs text-muted-foreground">
            💡 Tip: scan the QR printed on the certificate — it links straight
            to this page.
          </div>
        </form>
      </main>
    </div>
  );
}
