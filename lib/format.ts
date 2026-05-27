export const categories = [
  "Transportation",
  "Food",
  "Lodging",
  "Activities",
  "Supplies",
  "Other"
] as const;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function formatDate(value?: Date | string | null) {
  if (!value) return "TBD";

  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function dateInputValue(value?: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}
