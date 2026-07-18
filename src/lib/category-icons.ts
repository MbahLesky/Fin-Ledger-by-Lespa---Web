import {
  Banknote,
  Bolt,
  Briefcase,
  Car,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Utensils,
  type LucideIcon
} from "lucide-react";
import type { TransactionType } from "@/types";

// Maps the Flutter app's category iconKeys (lib/core/constants/system_defaults.dart)
// to lucide icons so the seeded categories render with real icons on the web.
const ICON_BY_KEY: Record<string, LucideIcon> = {
  salary: Banknote,
  freelance: Laptop,
  business: Briefcase,
  gift: Gift,
  food: Utensils,
  transport: Car,
  bills: Home,
  shopping: ShoppingBag,
  health: HeartPulse,
  airtime: Bolt
};

export function getCategoryIcon(iconKey?: string | null, type: TransactionType = "expense"): LucideIcon {
  if (iconKey && ICON_BY_KEY[iconKey]) {
    return ICON_BY_KEY[iconKey];
  }

  return type === "income" ? TrendingUp : TrendingDown;
}
