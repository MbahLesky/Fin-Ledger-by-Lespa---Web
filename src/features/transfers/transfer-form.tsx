import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldShell } from "@/components/forms/field-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { transfersRepository } from "@/db/repositories/transfers-repository";
import { transferSchema, type TransferFormValues } from "@/features/transfers/transfer-schema";
import { useBackendQuery } from "@/hooks/use-backend-query";
import { toDateInputValue } from "@/utils/date-utils";
import { formatCurrency } from "@/utils/formatting";

interface TransferFormProps {
  userId?: string | null;
  onSubmitted?: () => void;
}

export function TransferForm({ userId, onSubmitted }: TransferFormProps) {
  const { data: accounts = [] } = useBackendQuery(() => accountsRepository.listWithBalances(), []);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    mode: "onChange",
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      fee: 0,
      transferDate: toDateInputValue(),
      note: ""
    }
  });

  const fromAccountId = form.watch("fromAccountId");
  const toAccountId = form.watch("toAccountId");
  const amount = Number(form.watch("amount") ?? 0);
  const fee = Number(form.watch("fee") ?? 0);

  useEffect(() => {
    if (!accounts.length) {
      return;
    }

    const currentFromAccount = form.getValues("fromAccountId");
    const currentToAccount = form.getValues("toAccountId");

    if (!currentFromAccount) {
      form.setValue("fromAccountId", accounts[0].id, { shouldValidate: true });
    }

    if (!currentToAccount) {
      const fallbackDestination = accounts.find((account) => account.id !== accounts[0].id);
      if (fallbackDestination) {
        form.setValue("toAccountId", fallbackDestination.id, { shouldValidate: true });
      }
    }
  }, [accounts, form]);

  const fromAccount = useMemo(
    () => accounts.find((account) => account.id === fromAccountId),
    [accounts, fromAccountId]
  );

  const selectedCurrencyCode = fromAccount?.currencyCode ?? "USD";
  const sourceBalance = fromAccount?.currentBalance ?? 0;
  const totalDebit = amount + fee;
  const insufficientBalance = totalDebit > sourceBalance;
  const amountError =
    form.formState.errors.amount?.message ??
    (insufficientBalance ? "Insufficient source balance for amount plus fee." : undefined);

  async function onSubmit(values: TransferFormValues) {
    if (insufficientBalance) {
      form.setError("amount", {
        message: "Insufficient source balance for amount plus fee."
      });
      return;
    }

    try {
      await transfersRepository.createTransfer({
        ...values,
        userId
      });

      toast.success("Transfer saved to Supabase.");
      form.reset({
        ...values,
        amount: 0,
        fee: 0,
        note: "",
        transferDate: toDateInputValue()
      });
      onSubmitted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save this transfer.");
    }
  }

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <FieldShell
          label="From account"
          htmlFor="fromAccountId"
          hint={fromAccount ? `Available ${formatCurrency(sourceBalance, selectedCurrencyCode)}` : undefined}
          error={form.formState.errors.fromAccountId?.message}
        >
          <Select
            value={fromAccountId}
            onValueChange={(value) => {
              form.setValue("fromAccountId", value, { shouldValidate: true });
              if (value === toAccountId) {
                const fallbackDestination = accounts.find((account) => account.id !== value);
                form.setValue("toAccountId", fallbackDestination?.id ?? "", { shouldValidate: true });
              }
            }}
          >
            <SelectTrigger id="fromAccountId">
              <SelectValue placeholder="Choose source account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({formatCurrency(account.currentBalance, account.currencyCode)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label="To account" htmlFor="toAccountId" error={form.formState.errors.toAccountId?.message}>
          <Select
            value={toAccountId}
            onValueChange={(value) => form.setValue("toAccountId", value, { shouldValidate: true })}
          >
            <SelectTrigger id="toAccountId">
              <SelectValue placeholder="Choose destination account" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((account) => account.id !== fromAccountId)
                .map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FieldShell>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FieldShell label="Amount" htmlFor="amount" error={amountError}>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            hasError={Boolean(amountError)}
            {...form.register("amount")}
          />
        </FieldShell>

        <FieldShell label="Fee (optional)" htmlFor="fee" error={form.formState.errors.fee?.message}>
          <Input
            id="fee"
            type="number"
            step="0.01"
            min="0"
            hasError={Boolean(form.formState.errors.fee)}
            {...form.register("fee")}
          />
        </FieldShell>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FieldShell label="Date" htmlFor="transferDate" error={form.formState.errors.transferDate?.message}>
          <Input
            id="transferDate"
            type="date"
            hasError={Boolean(form.formState.errors.transferDate)}
            {...form.register("transferDate")}
          />
        </FieldShell>

        <FieldShell label="Summary" htmlFor="summary">
          <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
            Total debit from source:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(totalDebit, selectedCurrencyCode)}</span>
          </div>
        </FieldShell>
      </div>

      <FieldShell label="Note" htmlFor="note" error={form.formState.errors.note?.message}>
        <Textarea
          id="note"
          placeholder="Optional context for this transfer."
          hasError={Boolean(form.formState.errors.note)}
          {...form.register("note")}
        />
      </FieldShell>

      <Button
        type="submit"
        isLoading={form.formState.isSubmitting}
        disabled={!form.formState.isValid || insufficientBalance || accounts.length < 2}
      >
        Save transfer
      </Button>
    </form>
  );
}
