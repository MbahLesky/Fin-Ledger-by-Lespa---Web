import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { FieldShell } from "@/components/forms/field-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/features/auth/auth-layout";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { ROUTES } from "@/routes/route-constants";
import { useAuthStore } from "@/store/auth-store";

export function RegisterPage() {
  const authAvailable = useAuthStore((state) => state.authAvailable);
  const signUp = useAuthStore((state) => state.signUp);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
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

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof Error ? submitError.message : "Google sign-in failed."
      });
    }
  }

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Register"
      description="Start with a real authenticated identity, then move through currency, balances, reminders, and your ledger setup."
    >
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        {!authAvailable ? (
          <Card className="border-dashed border-accent/30 bg-accent/5">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              Authentication is unavailable until valid Firebase configuration is provided.
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

        <Button type="button" variant="outline" disabled={!authAvailable} onClick={() => void handleGoogle()}>
          <Sparkles className="size-4" />
          Continue with Google
        </Button>

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
