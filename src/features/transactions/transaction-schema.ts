import { z } from "zod";

export const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Choose a category."),
  accountId: z.string().min(1, "Choose an account."),
  note: z.string().max(140, "Keep the note under 140 characters.").default(""),
  transactionDate: z.string().min(1, "Choose a date.")
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

