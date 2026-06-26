export function normalizeLookupValue(value: string): string {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/\s+/g, "");
}
