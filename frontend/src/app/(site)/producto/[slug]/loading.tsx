export default function ProductoLoading() {
  return (
    <div className="container-px py-8">
      <div className="h-4 w-72 animate-pulse rounded bg-stone-bg" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-3xl bg-stone-bg" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-28 animate-pulse rounded bg-stone-bg" />
          <div className="h-9 w-2/3 animate-pulse rounded bg-stone-bg" />
          <div className="h-6 w-40 animate-pulse rounded bg-stone-bg" />
          <div className="h-20 w-full animate-pulse rounded bg-stone-bg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-16 animate-pulse rounded-full bg-stone-bg" />
            ))}
          </div>
          <div className="mt-2 h-12 w-full animate-pulse rounded-full bg-stone-bg" />
        </div>
      </div>
    </div>
  );
}
