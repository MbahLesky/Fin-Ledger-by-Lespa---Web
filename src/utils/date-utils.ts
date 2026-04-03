import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays
} from "date-fns";

export function nowIso() {
  return new Date().toISOString();
}

export function formatShortDate(date: string) {
  return format(parseISO(date), "MMM d, yyyy");
}

export function formatMonthLabel(date: string) {
  return format(parseISO(date), "MMM yyyy");
}

export function toDateInputValue(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function getRangeBounds(range: "today" | "7d" | "30d" | "month" | "week") {
  const today = new Date();

  if (range === "today") {
    return {
      start: startOfDay(today),
      end: endOfDay(today)
    };
  }

  if (range === "7d") {
    return {
      start: startOfDay(subDays(today, 6)),
      end: endOfDay(today)
    };
  }

  if (range === "30d") {
    return {
      start: startOfDay(subDays(today, 29)),
      end: endOfDay(today)
    };
  }

  if (range === "week") {
    return {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 })
    };
  }

  return {
    start: startOfMonth(today),
    end: endOfMonth(today)
  };
}

