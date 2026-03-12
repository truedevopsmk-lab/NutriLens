import type { DashboardMeal, Meal } from "@/types/api";
import { formatDateTime, formatMealType } from "@/utils/format";

type MealListProps = {
  items: Array<Meal | DashboardMeal>;
  showMealTotals?: boolean;
};

const hasFoods = (item: Meal | DashboardMeal): item is Meal => "totals" in item;

export function MealList({ items, showMealTotals = false }: MealListProps) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/12 bg-white/54 p-6 text-sm text-ink/64">
        No meals logged yet. Capture your next plate from the Log Meal tab.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-3xl bg-white/76 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">
                {formatMealType(item.mealType)}
              </p>
              <p className="mt-1 text-sm text-ink/60">{formatDateTime(item.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                {hasFoods(item) ? item.totals.calories : item.calories} kcal
              </p>
              {hasFoods(item) && showMealTotals ? (
                <p className="mt-1 text-xs text-ink/58">
                  P {item.totals.protein} / C {item.totals.carbs} / F {item.totals.fat}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {hasFoods(item)
              ? item.foods.map((food) => (
                  <span
                    key={food.id}
                    className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink/76"
                  >
                    {food.name}
                  </span>
                ))
              : item.foods.map((food) => (
                  <span
                    key={food}
                    className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-ink/76"
                  >
                    {food}
                  </span>
                ))}
          </div>
        </article>
      ))}
    </div>
  );
}
