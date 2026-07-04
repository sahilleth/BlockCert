import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Upload,
  FileText,
  LogOut,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/upload", label: "Upload", icon: Upload },
  { to: "/admin/certificates", label: "Certificates", icon: FileText },
] as const;

function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Synchronous gate: don't render children until hydrated AND admin.
  // Redirect in an effect (never during render).
  useEffect(() => {
    if (!auth.hydrated) return;
    if (!auth.isAuthenticated) {
      navigate({
        to: "/login",
        replace: true,
        search: { redirect: pathname },
      });
      return;
    }
    if (!auth.isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/", replace: true });
    }
  }, [
    auth.hydrated,
    auth.isAuthenticated,
    auth.isAdmin,
    navigate,
    pathname,
  ]);

  if (!auth.hydrated || !auth.isAuthenticated || !auth.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking access…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 flex-col border-r-2 border-foreground bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 border-b-2 border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">BlockCert</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((it) => {
            const active = pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t-2 border-sidebar-border p-3">
          <div className="mb-3 px-1 text-xs">
            <div className="font-semibold">{auth.user?.name ?? "—"}</div>
            <div className="truncate text-sidebar-foreground/60">
              {auth.user?.email}
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full font-semibold"
            onClick={() => {
              auth.logout();
              navigate({ to: "/login", replace: true });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b-2 border-foreground bg-sidebar px-4 text-sidebar-foreground md:hidden">
          <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold">
            <ShieldCheck className="h-5 w-5" /> BlockCert
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              auth.logout();
              navigate({ to: "/login", replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b-2 border-foreground bg-card p-2 md:hidden">
          {items.map((it) => {
            const active = pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
