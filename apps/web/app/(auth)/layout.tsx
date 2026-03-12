export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-grain opacity-80" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="glass-panel w-full rounded-panel p-6 sm:p-8">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-pine">
              NutriLens
            </p>
            <h1 className="text-3xl font-semibold text-ink">
              Calories in. Calories out. No manual guesswork.
            </h1>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
