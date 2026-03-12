import type { MealType } from "@/types/api";

export const formatMealType = (mealType: MealType) =>
  mealType.charAt(0) + mealType.slice(1).toLowerCase();

export const formatCalories = (value: number) => `${Math.round(value)} kcal`;

export const formatDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
