"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MealList } from "@/components/dashboard/meal-list";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { apiRequest } from "@/lib/api";
import { getStoredToken } from "@/lib/session";
import type { MealsResponse } from "@/types/api";

export default function MealHistoryPage() {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<MealsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (targetDays: number) => {
    try {
      setLoading(true);
      const response = await apiRequest<MealsResponse>(`/meals/history?days=${targetDays}`);
      setData(response);
      setError(null);
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : "Unable to load meal history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login");
      return;
    }

    void loadHistory(days);
  }, [days, router]);

  return (
    <AppShell
      subtitle="Review recent meals and their macro breakdowns"
      title="Meal history"
    >
      <SectionCard
        action={
          <div className="flex gap-2">
            {[7, 14, 30].map((option) => (
              <Button
                key={option}
                size="sm"
                variant={option === days ? "primary" : "ghost"}
                onClick={() => setDays(option)}
              >
                {option}d
              </Button>
            ))}
          </div>
        }
        description="Recent confirmed meals"
        title="History"
      >
        {loading ? <p className="text-sm text-ink/68">Loading meals...</p> : null}
        {error ? <p className="mb-3 text-sm text-ember">{error}</p> : null}
        <MealList items={data?.meals ?? []} showMealTotals />
      </SectionCard>
    </AppShell>
  );
}
