import Link from "next/link";
import Image from "next/image";
import { Heart } from "@phosphor-icons/react/dist/ssr";

export function SiteFooter() {
  return (
    <footer className="bg-brand-secondary text-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-[2.5px] border-white flex-shrink-0">
                <Image src="/maui-logo.svg" alt="GroomLocal mascot Maui" width={40} height={40} className="h-full w-full object-cover" />
              </div>
              <span className="font-heading text-lg font-bold text-slate-900">
                GroomLocal
              </span>
            </Link>
            <p className="text-sm text-slate-700 leading-relaxed">
              The Pacific Northwest&apos;s most trusted pet grooming directory. Find, compare, and book with confidence.
            </p>
          </div>

          {/* Washington */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-widest mb-4 text-slate-900">
              Washington
            </h4>
            <ul className="space-y-2">
              {[
                { name: "Seattle", slug: "seattle" },
                { name: "Tacoma", slug: "tacoma" },
                { name: "Bellevue", slug: "bellevue" },
                { name: "Olympia", slug: "olympia" },
              ].map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/dog-grooming/wa/${c.slug}`}
                    className="text-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Oregon */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-widest mb-4 text-slate-900">
              Oregon
            </h4>
            <ul className="space-y-2">
              {[
                { name: "Portland", slug: "portland" },
                { name: "Eugene", slug: "eugene" },
                { name: "Salem", slug: "salem" },
                { name: "Bend", slug: "bend" },
              ].map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/dog-grooming/or/${c.slug}`}
                    className="text-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-widest mb-4 text-slate-900">
              Company
            </h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">Contact</Link></li>
              <li><Link href="/for-groomers" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">For Groomers</Link></li>
              <li><Link href="/get-listed" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">Get Listed</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">Blog</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-700 hover:text-slate-900 transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider + Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} GroomLocal. Made with <Heart weight="fill" className="inline h-3 w-3 text-fun-pop" /> in the PNW
          </p>
        </div>
      </div>
    </footer>
  );
}
