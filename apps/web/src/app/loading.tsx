export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat produk">
      <div className="flex gap-2.5 overflow-hidden">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-11 w-28 shrink-0 animate-pulse rounded-full bg-white" />
        ))}
      </div>
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
        <div className="hidden space-y-3 lg:block">
          <div className="h-56 animate-pulse rounded-card bg-white" />
          <div className="h-28 animate-pulse rounded-card bg-white" />
          <div className="h-72 animate-pulse rounded-card bg-white" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-card bg-white">
              <div className="aspect-square animate-pulse bg-tile" />
              <div className="space-y-3 p-5">
                <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-tile" />
                <div className="mx-auto h-10 w-28 animate-pulse rounded-full bg-tile" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
