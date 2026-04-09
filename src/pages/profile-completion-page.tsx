import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FieldShell } from "@/components/forms/field-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { profileSchema, type ProfileFormValues } from "@/features/auth/schemas";
import { ROUTES } from "@/routes/route-constants";
import { useAuthStore } from "@/store/auth-store";

export function ProfileCompletionPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const saveProfile = useAuthStore((state) => state.saveProfile);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? "",
      phoneNumber: profile?.phoneNumber ?? ""
    }
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      await saveProfile({
        name: values.name,
        phoneNumber: values.phoneNumber || null
      });

      toast.success("Profile saved.");
      navigate(ROUTES.onboardingCurrency);
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to save your profile."
      });
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-xl">
        <CardContent className="grid gap-6 p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
              Complete your profile
            </p>
            <h1 className="text-3xl font-bold">One quick step before setup</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Your app profile needs a name before Fin Tracker can continue into currency, balances, and reminders.
            </p>
          </div>

          {form.formState.errors.root?.message ? (
            <Card className="border-danger/20 bg-danger/5">
              <CardContent className="p-4 text-sm text-danger">
                {form.formState.errors.root.message}
              </CardContent>
            </Card>
          ) : null}

          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldShell label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
              <Input id="name" hasError={Boolean(form.formState.errors.name)} {...form.register("name")} />
            </FieldShell>

            <FieldShell label="Phone" htmlFor="phoneNumber" hint="Optional for now">
              <Input id="phoneNumber" placeholder="+237612345678" {...form.register("phoneNumber")} />
            </FieldShell>

            <Button type="submit" isLoading={form.formState.isSubmitting}>
              Save and continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
