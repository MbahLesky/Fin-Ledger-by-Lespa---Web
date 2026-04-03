import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldShell } from "@/components/forms/field-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/features/auth/auth-layout";
import { COMING_SOON_MESSAGE } from "@/lib/constants";
import { phoneAuthSchema, type PhoneAuthFormValues } from "@/features/auth/schemas";

export function PhoneAuthPage() {
  const form = useForm<PhoneAuthFormValues>({
    resolver: zodResolver(phoneAuthSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: ""
    }
  });

  async function handleComingSoon() {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    toast.message("Phone authentication", {
      description: COMING_SOON_MESSAGE
    });
  }

  return (
    <AuthLayout
      eyebrow="Phone access"
      title="Continue with phone"
      description="Phone sign-in stays visible in the current web phase, but OTP delivery is intentionally reserved for a later milestone."
    >
      <Tabs defaultValue="signin" className="grid gap-5">
        <TabsList>
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="grid gap-5">
          <FieldShell
            label="Phone number"
            htmlFor="phoneNumber"
            hint="Use international format"
            error={form.formState.errors.phoneNumber?.message}
          >
            <Input
              id="phoneNumber"
              placeholder="+237612345678"
              hasError={Boolean(form.formState.errors.phoneNumber)}
              {...form.register("phoneNumber")}
            />
          </FieldShell>
          <Button type="button" onClick={handleComingSoon}>
            Send verification
          </Button>
        </TabsContent>
        <TabsContent value="signup" className="grid gap-5">
          <FieldShell label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message}>
            <Input id="fullName" {...form.register("fullName")} />
          </FieldShell>
          <FieldShell
            label="Phone number"
            htmlFor="signupPhoneNumber"
            hint="Use international format"
            error={form.formState.errors.phoneNumber?.message}
          >
            <Input
              id="signupPhoneNumber"
              placeholder="+237612345678"
              hasError={Boolean(form.formState.errors.phoneNumber)}
              {...form.register("phoneNumber")}
            />
          </FieldShell>
          <Button type="button" onClick={handleComingSoon}>
            Send verification
          </Button>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}

