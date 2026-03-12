"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { CaptureFlow } from "@/components/meal/capture-flow";
import { getStoredToken } from "@/lib/session";

export default function LogMealPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login");
    }
  }, [router]);

  return (
    <AppShell
      subtitle="Use the camera, review AI detections, and store the meal"
      title="Log meal"
    >
      <CaptureFlow />
    </AppShell>
  );
}
