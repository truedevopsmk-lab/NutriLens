import axios from "axios";

import { env } from "../config/env";
import type { DetectedFood } from "./openai-vision.service";

type NutritionLookupResult = {
  name: string;
  portionDescription: string;
  quantity?: number;
  unit?: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  externalFoodId?: string;
};

type TokenCache = {
  accessToken: string;
  expiresAt: number;
} | null;

let tokenCache: TokenCache = null;

const getFatSecretToken = async () => {
  if (
    tokenCache &&
    tokenCache.expiresAt > Date.now() + 60_000
  ) {
    return tokenCache.accessToken;
  }

  if (!env.FATSECRET_CLIENT_ID || !env.FATSECRET_CLIENT_SECRET) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "basic"
  });

  const response = await axios.post(
    env.FATSECRET_AUTH_URL,
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      auth: {
        username: env.FATSECRET_CLIENT_ID,
        password: env.FATSECRET_CLIENT_SECRET
      }
    }
  );

  tokenCache = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000
  };

  return tokenCache.accessToken;
};

const demoNutritionMap: Record<string, Omit<NutritionLookupResult, "portionDescription" | "quantity" | "unit" | "confidence">> = {
  idli: { name: "Idli", calories: 116, protein: 4, carbs: 24, fat: 1, fiber: 2.4 },
  sambar: { name: "Sambar", calories: 120, protein: 5, carbs: 17, fat: 3, fiber: 4.2 },
  "coconut chutney": { name: "Coconut chutney", calories: 88, protein: 1.3, carbs: 4.6, fat: 7.1, fiber: 2.1 },
  "orange vegetable cubes": { name: "Orange vegetable cubes", calories: 72, protein: 1.6, carbs: 16, fat: 0.3, fiber: 4.1 },
  "banana or ripe fruit": { name: "Banana or ripe fruit", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1 },
  "egg or corn bites": { name: "Egg or corn bites", calories: 134, protein: 6.2, carbs: 11.2, fat: 6.8, fiber: 1.7 },
  "green chutney": { name: "Green chutney", calories: 48, protein: 1.4, carbs: 4.2, fat: 2.8, fiber: 1.3 },
  "leafy curry": { name: "Leafy curry", calories: 118, protein: 4.4, carbs: 12.5, fat: 5.5, fiber: 4.9 },
  "green vegetable side": { name: "Green vegetable side", calories: 81, protein: 2.8, carbs: 10.2, fat: 3.2, fiber: 3.8 },
  "mixed rice or noodles": { name: "Mixed rice or noodles", calories: 264, protein: 6.9, carbs: 44.2, fat: 6.1, fiber: 3.5 },
  "flatbread or steamed cakes": { name: "Flatbread or steamed cakes", calories: 182, protein: 5.1, carbs: 31.8, fat: 3.4, fiber: 2.2 },
  "dal or curry": { name: "Dal or curry", calories: 146, protein: 6.1, carbs: 18.3, fat: 4.1, fiber: 5.3 },
  "cooked meal portion": { name: "Cooked meal portion", calories: 221, protein: 6.3, carbs: 29.1, fat: 8.2, fiber: 3.1 }
};

const findLocalNutritionMatch = (name: string) => {
  const normalized = name.toLowerCase();
  const exact = demoNutritionMap[normalized];

  if (exact) {
    return exact;
  }

  return Object.entries(demoNutritionMap).find(([key]) => normalized.includes(key))?.[1];
};

const coerceFoodArray = (foods: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(foods)) {
    return foods as Array<Record<string, unknown>>;
  }

  if (foods && typeof foods === "object") {
    return [foods as Record<string, unknown>];
  }

  return [];
};

const normalizeNutrition = (food: DetectedFood, apiFood?: Record<string, unknown>): NutritionLookupResult => {
  const servings = apiFood?.servings as Record<string, unknown> | undefined;
  const nestedServing = servings?.serving;
  const serving = Array.isArray(nestedServing)
    ? (nestedServing[0] as Record<string, unknown> | undefined)
    : (nestedServing as Record<string, unknown> | undefined) ?? (apiFood?.serving as Record<string, unknown> | undefined);

  return {
    name: String(apiFood?.food_name ?? food.name),
    portionDescription: food.estimatedPortion,
    quantity: food.quantity,
    unit: food.unit,
    confidence: food.confidence,
    calories: Number(serving?.calories ?? apiFood?.calories ?? 0),
    protein: Number(serving?.protein ?? apiFood?.protein ?? 0),
    carbs: Number(serving?.carbohydrate ?? apiFood?.carbohydrate ?? 0),
    fat: Number(serving?.fat ?? apiFood?.fat ?? 0),
    fiber: Number(serving?.fiber ?? apiFood?.fiber ?? 0),
    externalFoodId: apiFood?.food_id ? String(apiFood.food_id) : undefined
  };
};

export const enrichFoodsWithNutrition = async (
  foods: DetectedFood[],
  options?: { preferLocal?: boolean }
) => {
  const accessToken = await getFatSecretToken();

  if (!accessToken || options?.preferLocal) {
    return foods.map((food) => {
      const match = findLocalNutritionMatch(food.name);

      return {
        name: match?.name ?? food.name,
        portionDescription: food.estimatedPortion,
        quantity: food.quantity,
        unit: food.unit,
        confidence: food.confidence,
        calories: match?.calories ?? 0,
        protein: match?.protein ?? 0,
        carbs: match?.carbs ?? 0,
        fat: match?.fat ?? 0,
        fiber: match?.fiber ?? 0
      };
    });
  }

  const resolved = await Promise.all(
    foods.map(async (food) => {
      try {
        const response = await axios.get(env.FATSECRET_BASE_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params: {
            search_expression: `${food.name} ${food.estimatedPortion}`,
            region: env.FATSECRET_REGION,
            max_results: 1,
            format: "json"
          }
        });

        const candidates = coerceFoodArray(
          response.data?.foods_search?.results?.food ??
            response.data?.foods_search?.food ??
            response.data?.foods?.food
        );

        return normalizeNutrition(food, candidates[0]);
      } catch {
        const localMatch = findLocalNutritionMatch(food.name);

        return {
          name: localMatch?.name ?? food.name,
          portionDescription: food.estimatedPortion,
          quantity: food.quantity,
          unit: food.unit,
          confidence: food.confidence,
          calories: localMatch?.calories ?? 0,
          protein: localMatch?.protein ?? 0,
          carbs: localMatch?.carbs ?? 0,
          fat: localMatch?.fat ?? 0,
          fiber: localMatch?.fiber ?? 0
        };
      }
    })
  );

  return resolved;
};
