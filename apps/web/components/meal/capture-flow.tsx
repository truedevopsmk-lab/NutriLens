"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { apiRequest } from "@/lib/api";
import type { MealDraftResponse, MealType } from "@/types/api";
import { syncNutritionToHealthConnect } from "@/services/health-connect";

const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function CaptureFlow() {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<MealDraftResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCalories = useMemo(
    () => draft?.foods.reduce((sum, food) => sum + food.calories, 0) ?? 0,
    [draft]
  );

  const updateFood = (index: number, field: string, value: string) => {
    if (!draft) {
      return;
    }

    const nextFoods = draft.foods.map((food, foodIndex) => {
      if (foodIndex !== index) {
        return food;
      }

      if (["calories", "protein", "carbs", "fat", "fiber", "quantity"].includes(field)) {
        return { ...food, [field]: Number(value || 0) };
      }

      return { ...food, [field]: value };
    });

    setDraft({ ...draft, foods: nextFoods });
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setSyncStatus(null);

      const imageDataUrl = await fileToDataUrl(file);
      setPreview(imageDataUrl);

      const response = await apiRequest<MealDraftResponse>("/meals/photo-upload", {
        method: "POST",
        body: JSON.stringify({
          mealType,
          imageDataUrl
        })
      });

      setDraft(response);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Meal detection failed.");
    } finally {
      setBusy(false);
    }
  };

  const confirmMeal = async () => {
    if (!draft) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      const response = await apiRequest<{
        meal: unknown;
        healthConnectRecord: Parameters<typeof syncNutritionToHealthConnect>[0];
      }>("/meals/confirm", {
        method: "POST",
        body: JSON.stringify({
          mealType,
          imageDataUrl: preview ?? undefined,
          foods: draft.foods
        })
      });

      const healthResult = await syncNutritionToHealthConnect(response.healthConnectRecord);
      setSyncStatus(healthResult.message);
      router.push("/dashboard");
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Meal confirmation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        description="Capture the meal, let OpenAI detect foods, then confirm the macros"
        title="Photo capture"
      >
        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {mealTypes.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={value === mealType ? "primary" : "ghost"}
                  onClick={() => setMealType(value)}
                >
                  {value.toLowerCase()}
                </Button>
              ))}
            </div>

            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-panel border border-dashed border-ink/18 bg-white/66 p-6 text-center transition hover:border-ocean hover:bg-white/80">
              {preview ? (
                <Image
                  alt="Meal preview"
                  className="h-64 w-full rounded-3xl object-cover"
                  height={512}
                  src={preview}
                  width={512}
                />
              ) : (
                <>
                  <Camera className="mb-3 h-8 w-8 text-ocean" />
                  <p className="text-sm font-semibold">Capture or upload a meal photo</p>
                  <p className="mt-2 text-xs text-ink/58">
                    Mobile browsers will open the rear camera when supported.
                  </p>
                </>
              )}
              <input
                accept="image/*"
                capture="environment"
                className="hidden"
                type="file"
                onChange={onFileChange}
              />
            </label>
            {error ? <p className="text-sm text-ember">{error}</p> : null}
            {syncStatus ? <p className="text-sm text-pine">{syncStatus}</p> : null}
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-panel p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink/62">AI estimate</p>
                  <p className="mt-1 text-3xl font-semibold">{totalCalories} kcal</p>
                  {draft?.analysisNotice ? (
                    <p className="mt-2 max-w-md text-xs text-ink/60">
                      {draft.analysisNotice}
                    </p>
                  ) : null}
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ember/12 text-ember">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {draft?.foods.map((food, index) => (
                <div key={`${food.name}-${index}`} className="rounded-3xl bg-white/74 p-4">
                  <div className="grid gap-3">
                    <input
                      className="rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm font-medium outline-none"
                      value={food.name}
                      onChange={(event) => updateFood(index, "name", event.target.value)}
                    />
                    <input
                      className="rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm outline-none"
                      value={food.portionDescription}
                      onChange={(event) => updateFood(index, "portionDescription", event.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {[
                        { key: "calories", label: "Kcal" },
                        { key: "protein", label: "Protein" },
                        { key: "carbs", label: "Carbs" },
                        { key: "fat", label: "Fat" },
                        { key: "fiber", label: "Fiber" }
                      ].map((field) => (
                        <label key={field.key} className="text-xs text-ink/66">
                          {field.label}
                          <input
                            className="mt-1 w-full rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-sm outline-none"
                            type="number"
                            value={food[field.key as keyof typeof food] as number}
                            onChange={(event) => updateFood(index, field.key, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {!draft ? (
                <div className="rounded-3xl border border-dashed border-ink/12 bg-white/54 p-6 text-sm text-ink/60">
                  Upload a meal photo to populate detected foods and nutrition estimates.
                </div>
              ) : null}
            </div>

            <Button className="w-full" disabled={!draft} loading={busy} onClick={confirmMeal}>
              Confirm meal
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
