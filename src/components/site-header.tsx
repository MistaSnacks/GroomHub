"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { List, X, MagnifyingGlass, MapPin, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { NavDropdown } from "./nav-dropdown";
import type { CityWithCount } from "@/lib/types";
import { createClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cities, setCities] = useState<CityWithCount[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Fetch cities for nav dropdown
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data) => setCities(data))
      .catch(() => {
        // Fallback cities if API not available
        setCities([
          { slug: "seattle", name: "Seattle", state: "WA", state_abbr: "WA", groomer_count: 50 },
          { slug: "tacoma", name: "Tacoma", state: "WA", state_abbr: "WA", groomer_count: 25 },
          { slug: "bellevue", name: "Bellevue", state: "WA", state_abbr: "WA", groomer_count: 15 },
          { slug: "portland", name: "Portland", state: "OR", state_abbr: "OR", groomer_count: 30 },
          { slug: "olympia", name: "Olympia", state: "WA", state_abbr: "WA", groomer_count: 10 },
          { slug: "lakewood", name: "Lakewood", state: "WA", state_abbr: "WA", groomer_count: 8 },
        ]);
      });
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-bg/95 backdrop-blur-md shadow-sm py-0"
        : "bg-transparent py-1"
        }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-[2.5px] border-brand-secondary flex-shrink-0 transition-transform group-hover:scale-105">
              <Image src="/maui-logo.svg" alt="GroomHub mascot Maui" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold text-brand-primary leading-tight" style={{ letterSpacing: "-0.02em" }}>
                GroomHub
              </span>
              <span className="text-[9px] leading-none tracking-[2px] uppercase font-medium" style={{ color: "#956A46" }}>
                Pet Grooming Directory
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavDropdown label="Cities" type="cities" cities={cities} />
            <NavDropdown label="Services" type="services" />
            <NavDropdown label="Specialties" type="specialties" />
            <Link
              href="/blog"
              className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors mr-2"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                  }}
                  className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors mr-2"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors mr-2"
              >
                Log in
              </Link>
            )}
            <Link
              href="/for-groomers"
              className="rounded-full border-[1.5px] border-brand-primary/15 px-5 py-2.5 text-sm font-medium hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all"
              style={{ color: "#956A46" }}
            >
              List Your Business
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-brand-primary hover:bg-brand-primary/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X weight="bold" className="h-5 w-5" />
            ) : (
              <List weight="bold" className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-primary/10 py-4 space-y-1 bg-bg/95 backdrop-blur-md rounded-b-2xl">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Browse Cities</p>
              <div className="space-y-1">
                <Link href="/dog-grooming/wa" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors">
                  Washington
                </Link>
                <Link href="/dog-grooming/or" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors">
                  Oregon
                </Link>
              </div>
            </div>
            <div className="px-3 py-2 border-t border-brand-primary/10">
              <Link
                href="/blog"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/about"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </Link>
            </div>

            {/* Mobile Auth Links */}
            <div className="px-3 py-2 border-t border-brand-primary/10">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      setMobileOpen(false);
                    }}
                    className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
              )}
            </div>

            <div className="px-3 py-2 border-t border-brand-primary/10">
              <Link
                href="/for-groomers"
                className="block rounded-full bg-brand-secondary px-5 py-2.5 text-sm font-semibold text-brand-primary text-center hover:bg-brand-secondary/90 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                List Your Business
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
