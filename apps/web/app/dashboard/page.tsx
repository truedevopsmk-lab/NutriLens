"use client";

import { Flame, Footprints, HeartPulse, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { MacroBar } from "@/components/dashboard/macro-bar";
import { MealList } from "@/components/dashboard/meal-list";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { apiRequest } from "@/lib/api";
import { clearSession, getStoredToken } from "@/lib/session";
import type { DashboardResponse } from "@/types/api";
import { formatCalories } from "@/utils/format";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<DashboardResponse>("/dashboard");
      setData(response);
      setError(null);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load dashboard.");
      if (!getStoredToken()) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login");
      return;
    }

    void loadDashboard();
  }, [router]);

  const syncGarmin = async () => {
    try {
      setSyncing(true);
      await apiRequest("/garmin/sync");
      await loadDashboard();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Garmin sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <AppShell
      action={
        <Button size="sm" variant="ghost" onClick={logout}>
          Logout
        </Button>
      }
      subtitle="AI-assisted nutrition and wearable burn tracking"
      title="Dashboard"
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            accent="ember"
            label="Calories In"
            loading={loading}
            value={formatCalories(data?.caloriesIn ?? 0)}
          />
          <SummaryCard
            accent="pine"
            label="Calories Out"
            loading={loading}
            value={formatCalories(data?.caloriesOut ?? 0)}
          />
          <SummaryCard
            accent="ocean"
            label="Net Balance"
            loading={loading}
            value={formatCalories(data?.netCalories ?? 0)}
          />
        </div>

        <SectionCard
          action={
            <Button loading={syncing} size="sm" variant="secondary" onClick={syncGarmin}>
              <RefreshCcw className="h-4 w-4" />
              Sync Garmin
            </Button>
          }
          description="Daily macro totals versus wearable burn"
          title="Today"
        >
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <MacroBar current={data?.macros.protein ?? 0} goal={130} label="Protein" tone="ember" />
              <MacroBar current={data?.macros.carbs ?? 0} goal={220} label="Carbs" tone="citrus" />
              <MacroBar current={data?.macros.fat ?? 0} goal={70} label="Fat" tone="pine" />
              <MacroBar current={data?.macros.fiber ?? 0} goal={30} label="Fiber" tone="ocean" />
            </div>
            <div className="glass-panel rounded-panel p-4">
              <p className="text-sm font-medium text-ink/70">Wearable snapshot</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-ink/72">
                    <Flame className="h-4 w-4 text-ember" />
                    Burned
                  </span>
                  <span className="text-sm font-semibold">
                    {formatCalories(data?.activity?.caloriesBurned ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-ink/72">
                    <Footprints className="h-4 w-4 text-pine" />
                    Steps
                  </span>
                  <span className="text-sm font-semibold">{data?.activity?.steps ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-ink/72">
                    <HeartPulse className="h-4 w-4 text-ocean" />
                    Avg heart rate
                  </span>
                  <span className="text-sm font-semibold">
                    {data?.activity?.heartRateAvg ? `${data.activity.heartRateAvg} bpm` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          description="Meals detected and saved today"
          title="Meal timeline"
        >
          {error ? <p className="mb-3 text-sm text-ember">{error}</p> : null}
          <MealList items={data?.meals ?? []} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
