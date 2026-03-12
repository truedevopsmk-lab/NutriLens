export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type User = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type FoodDraft = {
  name: string;
  portionDescription: string;
  quantity?: number;
  unit?: string;
  confidence?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  externalFoodId?: string;
};

export type MealDraftResponse = {
  mealType: MealType;
  analysisSource?: "openai" | "local-fallback";
  analysisNotice?: string;
  foods: FoodDraft[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
};

export type Meal = {
  id: string;
  mealType: MealType;
  createdAt: string;
  foods: Array<{
    id: string;
    name: string;
    portionDescription: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
};

export type MealsResponse = {
  meals: Meal[];
};

export type DashboardMeal = {
  id: string;
  mealType: MealType;
  createdAt: string;
  calories: number;
  foods: string[];
};

export type DashboardResponse = {
  caloriesIn: number;
  caloriesOut: number;
  netCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  activity: {
    caloriesBurned: number;
    steps: number;
    heartRateAvg: number | null;
    activityCount: number;
  } | null;
  meals: DashboardMeal[];
};
