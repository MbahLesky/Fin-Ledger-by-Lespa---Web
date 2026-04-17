import { zodResolver } from "@hookform/resolvers/zod";
import { Smartphone, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FieldShell } from "@/components/forms/field-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/features/auth/auth-layout";
import { COMING_SOON_MESSAGE } from "@/lib/constants";
import { ROUTES } from "@/routes/route-constants";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/auth-store";

export function LoginPage() {
  const navigate = useNavigate();
  const authAvailable = useAuthStore((state) => state.authAvailable);
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);
  const notice = useAuthStore((state) => state.notice);
  const clearMessages = useAuthStore((state) => state.clearMessages);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    return () => clearMessages();
  }, [clearMessages]);

  async function onSubmit(values: LoginFormValues) {
    try {
      await signIn(values.email, values.password);
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof Error ? submitError.message : "Unable to sign in."
      });
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      description="Use your email and password to restore your session and load your shared Supabase ledger."
    >
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        {!authAvailable ? (
          <Card className="border-dashed border-accent/30 bg-accent/5">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              Authentication is unavailable until a valid Supabase project URL and publishable key are configured.
            </CardContent>
          </Card>
        ) : null}

        {notice ? (
          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="p-4 text-sm text-secondary">{notice}</CardContent>
          </Card>
        ) : null}

        {error || form.formState.errors.root?.message ? (
          <Card className="border-danger/20 bg-danger/5">
            <CardContent className="p-4 text-sm text-danger">
              {form.formState.errors.root?.message ?? error}
            </CardContent>
          </Card>
        ) : null}

        <FieldShell label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            hasError={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
        </FieldShell>

        <FieldShell
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            hasError={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </FieldShell>

        <Button type="submit" isLoading={form.formState.isSubmitting} disabled={!authAvailable}>
          Log in
        </Button>

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.message("Google sign-in", { description: COMING_SOON_MESSAGE })}
          >
            <Sparkles className="size-4" />
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.phoneAuth)}
          >
            <Smartphone className="size-4" />
            Continue with phone
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-semibold text-primary" to={ROUTES.register}>
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
