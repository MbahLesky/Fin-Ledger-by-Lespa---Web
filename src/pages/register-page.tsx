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
  const [googleLoading, setGoogleLoading] = useState(false);

  // Seeded from /register?code=LEADERS (or a code captured earlier in the session),
  // so a tester following a partner link never retypes it.
  const inviteCodeFromUrl = useInviteCode();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      inviteCode: ""
    }
  });

  const { setValue } = form;

  useEffect(() => {
    if (inviteCodeFromUrl) {
      setValue("inviteCode", inviteCodeFromUrl);
    }
  }, [inviteCodeFromUrl, setValue]);

  useEffect(() => {
    return () => clearMessages();
  }, [clearMessages]);

  async function onSubmit(values: RegisterFormValues) {
    try {
      await signUp(values.fullName, values.email, values.password, values.inviteCode ?? "");
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof Error ? submitError.message : "Unable to register."
      });
    }
  }

  async function handleGoogle() {
    form.clearErrors("root");
    setGoogleLoading(true);
    try {
      await signInWithGoogle(form.getValues("inviteCode") ?? "");
    } catch (submitError) {
      form.setError("root", {
        message: submitError instanceof Error ? submitError.message : "Google sign-in failed."
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  const formError = form.formState.errors.root?.message ?? error;

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Register"
      description="Start with a real authenticated identity, then move through currency, balances, reminders, and your ledger setup."
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
          label="Sign up with Google"
          disabled={!authAvailable || form.formState.isSubmitting}
          isLoading={googleLoading}
          onClick={() => void handleGoogle()}
        />

        <AuthDivider label="or" />

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldShell
            label="Full name"
            htmlFor="fullName"
            error={form.formState.errors.fullName?.message}
          >
            <Input
              id="fullName"
              autoComplete="name"
              hasError={Boolean(form.formState.errors.fullName)}
              {...form.register("fullName")}
            />
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

          <div className="grid gap-2">
            <FieldShell
              label="Access code"
              htmlFor="inviteCode"
              hint="Optional"
              error={form.formState.errors.inviteCode?.message}
            >
              <Input
                id="inviteCode"
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="e.g. LEADERS"
                hasError={Boolean(form.formState.errors.inviteCode)}
                {...form.register("inviteCode", {
                  setValueAs: (value: string) => value.trim().toUpperCase()
                })}
              />
            </FieldShell>
            <p className="text-xs leading-5 text-muted-foreground">
              Have a code from an organization or partner? Enter it — otherwise leave it blank to
              join as a general tester.
            </p>
          </div>

          <Button
            type="submit"
            isLoading={form.formState.isSubmitting}
            disabled={!authAvailable || googleLoading}
          >
            Register
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-semibold text-primary" to={ROUTES.login}>
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
