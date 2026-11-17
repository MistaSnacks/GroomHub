import Link from "next/link";
import { MauiMascot } from "@/components/maui-mascot";
import { WaveDivider } from "@/components/wave-divider";
import { MagnifyingGlass, House } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <>
    <div className="page-band page-band-coral relative flex min-h-[70vh] flex-1 items-center justify-center px-4">
      <div className="text-center max-w-md">
        <MauiMascot
          src="/maui-assets/05-maui-sitting-pretty.png?v=maui-20260904-alpha1"
          size={160}
          interactive={false}
          priority
        />

        <h1 className="font-heading text-5xl font-bold text-brand-primary mt-6 mb-3">
          404
        </h1>
        <p className="font-heading text-xl font-bold text-brand-primary mb-2">
          Page not found
        </p>
        <p className="text-text-muted mb-8">
          Looks like this page wandered off. Even Maui can&apos;t sniff it out.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-sm"
          >
            <House weight="bold" className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/dog-grooming"
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-6 py-3 text-sm font-bold text-brand-primary transition-all hover:bg-white"
          >
            <MagnifyingGlass weight="bold" className="w-4 h-4" />
            Browse Directory
          </Link>
        </div>
      </div>
    </div>
    <WaveDivider variant="footer" fromColor="#FF7E67" toColor="#4ECDC4" />
    </>
  );
}
