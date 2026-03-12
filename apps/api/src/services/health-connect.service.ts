type HealthConnectNutritionRecord = {
  mealName: string;
  consumedAt: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
};

export const buildHealthConnectRecord = (input: HealthConnectNutritionRecord) => ({
  type: "NutritionRecord",
  mealName: input.mealName,
  startTime: input.consumedAt,
  endTime: input.consumedAt,
  nutrients: {
    energyKilocalories: input.nutrients.calories,
    proteinGrams: input.nutrients.protein,
    totalCarbohydrateGrams: input.nutrients.carbs,
    totalFatGrams: input.nutrients.fat,
    dietaryFiberGrams: input.nutrients.fiber
  },
  metadata: {
    recordingMethod: "manual_entry",
    sourceDeviceType: "phone"
  }
});
