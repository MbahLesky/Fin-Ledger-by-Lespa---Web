import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/constants";

export function formatCurrency(value: number, currencyCode = DEFAULT_CURRENCY) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${getCurrencySymbol(currencyCode)} ${value.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode: string) {
  return SUPPORTED_CURRENCIES.find((item) => item.code === currencyCode)?.symbol ?? currencyCode;
}

export function formatRelativeTime(timestamp?: string | null) {
  if (!timestamp) {
    return "Never";
  }

  return formatDistanceToNowStrict(parseISO(timestamp), { addSuffix: true });
}

export function formatAmountInput(value: number | string) {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numericValue)) {
    return "0.00";
  }

  return numericValue.toFixed(2);
}

