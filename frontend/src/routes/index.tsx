import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Fingerprint, QrCode, ArrowRight, Link2 } from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";

const TAGLINE =
  (import.meta.env.VITE_APP_TAGLINE as string) ??
  "Blockchain Certificate Verification";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="border-b-2 border-foreground bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
            <div>
              <div className="inline-flex items-center gap-2 border-2 border-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tamper-proof
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tighter sm:text-6xl">
                Academic certificates
                <br />
                <span className="text-primary-foreground/60">verified on chain.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base text-primary-foreground/80 sm:text-lg">
                {TAGLINE}. Colleges issue certificates, we anchor a SHA-256 hash on
                Polygon, and employers verify instantly by scanning a QR code.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="font-semibold">
                  <Link to="/verify">
                    Verify Certificate <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground bg-transparent font-semibold text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <Link to="/login">Admin Login</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="border-4 border-primary-foreground bg-secondary p-6 text-secondary-foreground">
                <div className="flex items-center justify-between border-b-2 border-secondary-foreground pb-3">
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Certificate
                  </span>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="mt-4 space-y-3">
                  <Field label="Student" value="Ada Lovelace" />
                  <Field label="Course" value="B.Sc. Computer Science" />
                  <Field label="Department" value="Analytical Engines" />
                  <Field label="Issued" value="2026-06-14" />
                </div>
                <div className="mt-5 border-t-2 border-secondary-foreground pt-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest">
                    SHA-256
                  </div>
                  <div className="mt-1 break-all font-mono text-xs">
                    0x8f2c…a91e — anchored to Polygon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            How BlockCert works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Step
              icon={<Fingerprint className="h-6 w-6" />}
              num="01"
              title="Hash the PDF"
              body="Admins upload a signed PDF. We compute its SHA-256 fingerprint on the server."
            />
            <Step
              icon={<Link2 className="h-6 w-6" />}
              num="02"
              title="Anchor on chain"
              body="The hash is written to a smart contract on Polygon — immutable and public."
            />
            <Step
              icon={<QrCode className="h-6 w-6" />}
              num="03"
              title="Verify with QR"
              body="Employers scan the QR code and see a live blockchain-backed audit trail."
            />
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-foreground bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} BlockCert</span>
          <span>Polygon-anchored certificates</span>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Step({
  icon,
  num,
  title,
  body,
}: {
  icon: React.ReactNode;
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div className="border-2 border-foreground bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
          {icon}
        </div>
        <span className="font-mono text-sm font-bold text-muted-foreground">{num}</span>
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
