import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, LogIn } from "lucide-react";

import { PublicNav } from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useLogin } from "@/lib/queries";
import { apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — BlockCert" },
      { name: "description", content: "Admin login for BlockCert." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(200),
});
type FormData = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const loginM = useLogin();

  useEffect(() => {
    if (auth.isAuthenticated && auth.isAdmin) {
      navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [auth.isAuthenticated, auth.isAdmin, navigate]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await auth.login(values.email, values.password);
      toast.success(`Welcome back, ${user.name}`);
      if (user.role === "ADMIN") navigate({ to: "/admin/dashboard" });
      else navigate({ to: "/" });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Access the BlockCert admin console.
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 border-2 border-foreground bg-card p-6"
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@blockcert.edu"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={loginM.isPending || form.formState.isSubmitting}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>

          <p className="border-t-2 border-dashed border-border pt-3 text-xs text-muted-foreground">
            Demo: <span className="font-mono">admin@blockcert.edu</span> /{" "}
            <span className="font-mono">Admin@123456</span>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not an admin?{" "}
          <Link to="/verify" className="font-semibold text-foreground underline">
            Verify a certificate
          </Link>
        </p>
      </main>
    </div>
  );
}
