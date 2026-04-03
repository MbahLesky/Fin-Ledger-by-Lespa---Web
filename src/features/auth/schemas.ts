import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match."
  });

export const phoneAuthSchema = z.object({
  fullName: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "Use international phone format, for example +237612345678.")
});

export const profileSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  phoneNumber: z.string().optional()
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type PhoneAuthFormValues = z.infer<typeof phoneAuthSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;

