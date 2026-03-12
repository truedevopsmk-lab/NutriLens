export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === "object" && "toString" in value) {
    const parsed = parseFloat((value as any).toString());
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function roundTo(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}