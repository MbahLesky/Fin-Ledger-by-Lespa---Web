import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { FieldShell } from "@/components/forms/field-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthDivider } from "@/features/auth/auth-divider";
import { AuthLayout } from "@/features/auth/auth-layout";
import { GoogleAuthButton } from "@/features/auth/google-auth-button";
import { useInviteCode } from "@/features/auth/use-invite-code";
import { ROUTES } from "@/routes/route-constants";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/auth-store";

export function LoginPage() {
  const authAvailable = useAuthStore((state) => state.authAvailable);
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const error = useAuthStore((state) => state.error);
  const notice = useAuthStore((state) => state.notice);
  const clearMessages = useAuthStore((state) => state.clearMessages);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google sign-in creates an account when there is none, so a tester arriving on
  // a partner link (/login?code=LEADERS) still gets attributed to that code.
  const inviteCode = useInviteCode();

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
        message: submitError instanceof Error ? submitError.message : "Unable to log in."
      });
    }
  }

  async function handleGoogle() {
    form.clearErrors("root");
    setGoogleLoading(true);
    try {
      await signInWithGoogle(inviteCode);
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof Error ? submitError.message : "Google sign-in failed."
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Enter your email first to reset your password." });
      return;
    }

    try {
      await resetPassword(email);
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof Error ? submitError.message : "Unable to send reset email."
      });
    }
  }

  const formError = form.formState.errors.root?.message ?? error;

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      description="Use your email and password to restore your session, sync your local ledger, and continue where you left off."
    >
      <div className="grid gap-5">
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

        {formError ? (
          <Card className="border-danger/20 bg-danger/5">
            <CardContent className="p-4 text-sm text-danger">{formError}</CardContent>
          </Card>
        ) : null}

        <GoogleAuthButton
          label="Continue with Google"
          disabled={!authAvailable || form.formState.isSubmitting}
          isLoading={googleLoading}
          onClick={() => void handleGoogle()}
        />

        <AuthDivider label="or" />

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
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

          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm font-semibold text-primary"
              onClick={() => void handleForgotPassword()}
              disabled={!authAvailable}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            isLoading={form.formState.isSubmitting}
            disabled={!authAvailable || googleLoading}
          >
            Log in
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-semibold text-primary" to={ROUTES.register}>
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
