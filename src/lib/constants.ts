import type { AccountType } from "@/types/common";

export const APP_NAME = "MoniLog";

export const APP_LONG_NAME = "MoniLog finance tracker";

export const APP_SUPPORT_NAME = "Finance tracker";

export const APP_TAGLINE = "Track your every dime";

export const DEFAULT_ACCOUNTS: Array<{
  name: string;
  type: AccountType;
  displayOrder: number;
}> = [
  {
    name: "Cash",
    type: "cash",
    displayOrder: 0
  },
  {
    name: "Bank",
    type: "bank",
    displayOrder: 1
  }
];

export const DEFAULT_CATEGORY_SEEDS = [
  {
    name: "General income",
    type: "income",
    iconKey: "arrow-up-right",
    colorKey: "success"
  },
  {
    name: "General expense",
    type: "expense",
    iconKey: "arrow-down-right",
    colorKey: "danger"
  }
] as const;

export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "XAF", label: "Central African CFA Franc", symbol: "FCFA" },
  { code: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "GH₵" },
  { code: "ZAR", label: "South African Rand", symbol: "R" }
] as const;

export const DEFAULT_CURRENCY = "USD";

export const COMING_SOON_MESSAGE =
  "This path stays visible in the UI, but it is not active in the current web phase yet.";
