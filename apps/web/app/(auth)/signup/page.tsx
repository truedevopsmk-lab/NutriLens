"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { saveSession } from "@/lib/session";
import type { AuthResponse } from "@/types/api";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiRequest<AuthResponse>("/auth/signup", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email, password })
      });

      saveSession(response);
      router.push("/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Create account</h2>
        <p className="mt-2 text-sm text-ink/68">
          Start logging food from photos and syncing burn data from wearables.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          autoComplete="email"
          label="Email"
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          autoComplete="new-password"
          helperText="Use at least 8 characters."
          label="Password"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-ember">{error}</p> : null}
        <Button className="w-full" loading={submitting} type="submit">
          Create account
        </Button>
      </form>
      <p className="text-sm text-ink/70">
        Already registered?{" "}
        <Link className="font-semibold text-ocean" href="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
