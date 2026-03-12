"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, LayoutDashboard, ScrollText } from "lucide-react";

import { getStoredUser } from "@/lib/session";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log-meal", label: "Log meal", icon: Camera },
  { href: "/meal-history", label: "History", icon: ScrollText }
];

export function AppShell({ action, children, subtitle, title }: AppShellProps) {
  const pathname = usePathname();
  const [email, setEmail] = useState("Signed in");

  useEffect(() => {
    setEmail(getStoredUser()?.email ?? "Signed in");
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">NutriLens</p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-ink/70">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel rounded-full px-4 py-2 text-sm text-ink/72">
            {email}
          </div>
          {action}
        </div>
      </div>

      {children}

      <nav className="glass-panel fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl items-center justify-between rounded-full px-3 py-3">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              className={`flex min-w-24 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? "bg-ink text-white" : "text-ink/72 hover:bg-white/70"
              }`}
              href={link.href}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
