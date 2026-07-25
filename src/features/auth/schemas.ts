import { z } from "zod";

// Log-in only checks that a password was typed. The 8-character rule belongs to
// registration — enforcing it here would lock out testers who registered on the
// landing page while it still accepted 6.
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.")
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    // Optional, exactly as on the landing page: blank joins the general tester
    // pool, a value must match an active code in Firestore.
    inviteCode: z
      .string()
      .trim()
      .max(32, "That access code is too long.")
      .optional()
      .or(z.literal(""))
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match."
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
