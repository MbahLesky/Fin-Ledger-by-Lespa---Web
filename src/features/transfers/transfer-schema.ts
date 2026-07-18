import { z } from "zod";

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Choose a source account."),
    toAccountId: z.string().min(1, "Choose a destination account."),
    amount: z.coerce.number().positive("Amount must be greater than zero."),
    sourceFee: z.coerce.number().min(0, "Fee cannot be negative.").default(0),
    destinationFee: z.coerce.number().min(0, "Fee cannot be negative.").default(0),
    transferDate: z.string().min(1, "Choose a date."),
    description: z.string().max(140, "Keep the note under 140 characters.").default("")
  })
  .refine((value) => value.fromAccountId !== value.toAccountId, {
    path: ["toAccountId"],
    message: "From and to accounts must be different."
  })
  .refine((value) => value.destinationFee <= value.amount, {
    path: ["destinationFee"],
    message: "Destination fee cannot exceed the transfer amount."
  });

export type TransferFormValues = z.infer<typeof transferSchema>;
