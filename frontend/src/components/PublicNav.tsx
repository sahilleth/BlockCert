import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const APP_NAME = (import.meta.env.VITE_APP_NAME as string) ?? "BlockCert";

export function PublicNav() {
  const { isAuthenticated, isAdmin } = useAuth();
  return (
    <header className="border-b-2 border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-muted" }}
          >
            Home
          </Link>
          <Link
            to="/verify"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            activeProps={{ className: "bg-muted" }}
          >
            Verify
          </Link>
          {isAuthenticated && isAdmin ? (
            <Button asChild size="sm">
              <Link to="/admin/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Admin Login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
