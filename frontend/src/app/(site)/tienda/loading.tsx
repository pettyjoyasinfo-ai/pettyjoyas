export default function TiendaLoading() {
  return (
    <div className="container-px py-8">
      <div className="h-4 w-40 animate-pulse rounded bg-stone-bg" />
      <div className="mt-6 mb-8 h-9 w-56 animate-pulse rounded bg-stone-bg" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden flex-col gap-4 lg:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-bg" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[3/4] animate-pulse rounded-2xl bg-stone-bg" />
              <div className="h-3 w-20 animate-pulse rounded bg-stone-bg" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-stone-bg" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-stone-bg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
