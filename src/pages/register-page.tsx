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
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { COMING_SOON_MESSAGE } from "@/lib/constants";
import { ROUTES } from "@/routes/route-constants";
import { useAuthStore } from "@/store/auth-store";

export function RegisterPage() {
  const navigate = useNavigate();
  const authAvailable = useAuthStore((state) => state.authAvailable);
  const signUp = useAuthStore((state) => state.signUp);
  const error = useAuthStore((state) => state.error);
  const notice = useAuthStore((state) => state.notice);
  const clearMessages = useAuthStore((state) => state.clearMessages);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    return () => clearMessages();
  }, [clearMessages]);

  async function onSubmit(values: RegisterFormValues) {
    try {
      await signUp(values.fullName, values.email, values.password);
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof Error ? submitError.message : "Unable to register."
      });
    }
  }

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Register"
      description="Start with a real authenticated identity, then move through currency, balances, reminders, and your ledger setup."
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

        <FieldShell
          label="Full name"
          htmlFor="fullName"
          error={form.formState.errors.fullName?.message}
        >
          <Input id="fullName" hasError={Boolean(form.formState.errors.fullName)} {...form.register("fullName")} />
        </FieldShell>

        <FieldShell label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            hasError={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
        </FieldShell>

        <div className="grid gap-5 md:grid-cols-2">
          <FieldShell
            label="Password"
            htmlFor="password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              hasError={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
          </FieldShell>

          <FieldShell
            label="Confirm password"
            htmlFor="confirmPassword"
            error={form.formState.errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              hasError={Boolean(form.formState.errors.confirmPassword)}
              {...form.register("confirmPassword")}
            />
          </FieldShell>
        </div>

        <Button type="submit" isLoading={form.formState.isSubmitting} disabled={!authAvailable}>
          Register
        </Button>

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.message("Google sign-up", { description: COMING_SOON_MESSAGE })}
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
          Already have an account?{" "}
          <Link className="font-semibold text-primary" to={ROUTES.login}>
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

