type HealthConnectPayload = {
  type: "NutritionRecord";
  mealName: string;
  startTime: string;
  endTime: string;
  nutrients: {
    energyKilocalories: number;
    proteinGrams: number;
    totalCarbohydrateGrams: number;
    totalFatGrams: number;
    dietaryFiberGrams: number;
  };
  metadata: {
    recordingMethod: string;
    sourceDeviceType: string;
  };
};

declare global {
  interface Window {
    AndroidHealthConnect?: {
      writeNutritionRecord: (payload: string) => Promise<void> | void;
    };
    webkit?: {
      messageHandlers?: {
        healthConnect?: {
          postMessage: (payload: HealthConnectPayload) => void;
        };
      };
    };
  }
}

export async function syncNutritionToHealthConnect(payload: HealthConnectPayload) {
  if (typeof window === "undefined") {
    return { status: "skipped", message: "Health Connect sync skipped on the server." };
  }

  if (window.AndroidHealthConnect?.writeNutritionRecord) {
    await Promise.resolve(window.AndroidHealthConnect.writeNutritionRecord(JSON.stringify(payload)));
    return { status: "synced", message: "Health Connect record written through Android bridge." };
  }

  if (window.webkit?.messageHandlers?.healthConnect) {
    window.webkit.messageHandlers.healthConnect.postMessage(payload);
    return { status: "queued", message: "Health Connect payload sent to native bridge." };
  }

  return {
    status: "unsupported",
    message: "No native Health Connect bridge detected. Meal was saved in NutriLens."
  };
}
