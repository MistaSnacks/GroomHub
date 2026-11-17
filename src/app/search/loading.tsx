import { WaveDivider } from "@/components/wave-divider";

export default function SearchLoading() {
  return (
    <>
      {/* Band skeleton: the same band as the loaded page, so the header does not change colour. */}
      <section className="page-band relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-40 rounded-full bg-white/40 animate-pulse mb-5" />
          <div className="h-11 w-72 max-w-full rounded-full bg-white/40 animate-pulse mb-3" />
          <div className="h-5 w-36 rounded-full bg-white/40 animate-pulse" />
          <div className="mt-5 max-w-2xl flex gap-2">
            <div className="h-11 flex-1 rounded-xl bg-white/60 animate-pulse" />
            <div className="h-11 w-24 rounded-xl bg-white/60 animate-pulse" />
          </div>
        </div>
      </section>
      <WaveDivider variant="gentle" fromColor="#4ECDC4" toColor="#FDF8F0" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Result card skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-white overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="sm:w-40 md:w-48 h-40 sm:h-auto shrink-0 bg-surface animate-pulse" />
            <div className="flex-1 p-4 md:p-5 space-y-3">
              <div className="h-5 w-3/4 rounded-full bg-surface animate-pulse" />
              <div className="h-3 w-1/2 rounded-full bg-surface animate-pulse" />
              <div className="flex gap-1.5">
                <div className="h-5 w-16 rounded-full bg-surface animate-pulse" />
                <div className="h-5 w-20 rounded-full bg-surface animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-surface animate-pulse" />
              </div>
              <div className="h-4 w-24 rounded-full bg-surface animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
