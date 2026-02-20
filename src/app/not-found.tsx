import Link from "next/link";
import { MauiMascot } from "@/components/maui-mascot";
import { MagnifyingGlass, House } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-md">
        <MauiMascot
          src="/maui-assets/05-maui-sitting-pretty.png"
          size={160}
          animation="float"
          interactive={false}
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
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold text-brand-primary transition-all hover:bg-brand-primary/5"
          >
            <MagnifyingGlass weight="bold" className="w-4 h-4" />
            Browse Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
