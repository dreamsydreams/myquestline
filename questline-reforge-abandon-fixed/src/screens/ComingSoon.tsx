export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-2xl text-camp-parchment">{label}</h1>
      <p className="text-camp-parchment-dim">
        This part of the world hasn't been built yet — a later phase covers it.
      </p>
    </div>
  );
}
