"use client";

import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { CaretDown, MagnifyingGlass, MapPin, PawPrint, X } from "@phosphor-icons/react/dist/ssr";
import { NavMegaMenu } from "./nav-mega-menu";
import { MobileNav } from "./mobile-nav";
import type { CityWithCount } from "@/lib/types";
import { createClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

interface SiteHeaderProps {
  cities?: CityWithCount[];
}

/** The pages that "Find a groomer" leads to, and the pages for groomers. */
const FIND_ROOTS = ["/dog-grooming", "/cat-grooming", "/mobile-grooming", "/services", "/specialties", "/search", "/groomer"];
const GROOMER_ROOTS = ["/for-groomers", "/get-listed", "/pricing", "/claim", "/dashboard"];

const NAV_LINK = "rounded-full px-3 py-2 text-sm transition-colors hover:bg-[#E3F8F5] hover:text-brand-primary";
const NAV_IDLE = "font-medium text-slate-700";
const NAV_ACTIVE = "bg-[#E3F8F5] font-semibold text-brand-primary";

function under(pathname: string, roots: string[]) {
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

function SearchField({
  id,
  placeholder,
  className = "",
  autoFocus,
  onSubmit,
}: {
  id: string;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <Form
      action="/search"
      role="search"
      onSubmit={onSubmit}
      className={`nav-search flex items-center gap-2 rounded-full border-[1.5px] border-border pl-3.5 pr-1 transition-shadow ${className}`}
    >
      <MapPin weight="fill" aria-hidden="true" className="h-4 w-4 shrink-0 text-[#0F766E]" />
      <label htmlFor={id} className="sr-only">
        Search by city, ZIP code, service or groomer name
      </label>
      <input
        id={id}
        name="q"
        type="text"
        inputMode="search"
        enterKeyHint="search"
        required
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-brand-primary outline-none placeholder:text-slate-500"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition-colors hover:bg-darkest"
      >
        <MagnifyingGlass weight="bold" className="h-4 w-4" />
      </button>
    </Form>
  );
}

export function SiteHeader({ cities = [] }: SiteHeaderProps) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const megaButton = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  /** On phones the header is solid after a scroll and while the search row is open. */
  const solid = scrolled || searchOpen;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
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
    if (!megaOpen) return;
    function closeOnOutsidePress(event: MouseEvent) {
      if (!bar.current?.contains(event.target as Node)) setMegaOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsidePress);
    return () => document.removeEventListener("mousedown", closeOnOutsidePress);
  }, [megaOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const findActive = megaOpen || under(pathname, FIND_ROOTS);

  return (
    <>
      <header
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          if (megaOpen) {
            setMegaOpen(false);
            megaButton.current?.focus();
          } else if (searchOpen) {
            setSearchOpen(false);
            searchButton.current?.focus();
          }
        }}
        data-at-top={solid ? undefined : ""}
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,padding] duration-300 lg:pointer-events-none lg:bg-transparent lg:py-2 lg:shadow-none lg:backdrop-blur-none ${scrolled
          ? "bg-bg/95 py-0 shadow-sm backdrop-blur-md"
          : isHome && !searchOpen
            ? "bg-transparent py-1"
            : "bg-bg py-1"
          }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* From 1024px this row is a white pill that floats over the page. */}
          <div
            ref={bar}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMegaOpen(false);
            }}
            className={`relative flex h-16 items-center justify-between lg:pointer-events-auto lg:h-14 lg:justify-start lg:rounded-full lg:bg-white lg:pl-2.5 lg:pr-2 lg:transition-shadow ${scrolled || megaOpen
              ? "lg:shadow-[0_12px_34px_rgba(15,23,42,0.2)]"
              : "lg:shadow-[0_8px_26px_rgba(15,23,42,0.13)]"
              }`}
          >
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="header-logo-ring flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-brand-secondary transition-transform group-hover:scale-105">
                <Image src="/maui-logo-circle.svg" alt="GroomLocal mascot Maui" width={40} height={40} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-xl font-bold leading-tight text-brand-primary" style={{ letterSpacing: "-0.02em" }}>
                  GroomLocal
                </span>
                <span className="brand-tagline text-[9px] font-medium uppercase leading-none tracking-[2px] lg:hidden xl:block">
                  Pet Grooming Directory
                </span>
              </div>
            </Link>

            <nav aria-label="Main" className="ml-3 hidden items-center gap-0.5 lg:flex xl:ml-5 xl:gap-1">
              <button
                type="button"
                ref={megaButton}
                onClick={() => setMegaOpen(!megaOpen)}
                aria-expanded={megaOpen}
                aria-controls="nav-find"
                className={`${NAV_LINK} flex items-center gap-1.5 ${findActive ? NAV_ACTIVE : NAV_IDLE}`}
              >
                Find a groomer
                <CaretDown weight="bold" className={`h-3 w-3 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
              </button>
              <Link href="/blog" className={`${NAV_LINK} ${under(pathname, ["/blog"]) ? NAV_ACTIVE : NAV_IDLE}`}>
                Guides
              </Link>
              {/* A signed-in visitor is a groomer already, so the pitch gives way to the dashboard. */}
              {user ? (
                <Link href="/dashboard" className={`${NAV_LINK} ${under(pathname, GROOMER_ROOTS) ? NAV_ACTIVE : NAV_IDLE}`}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/for-groomers" className={`${NAV_LINK} ${under(pathname, GROOMER_ROOTS) ? NAV_ACTIVE : NAV_IDLE}`}>
                  For Groomers
                </Link>
              )}
            </nav>

            <div className="ml-auto hidden items-center gap-2 lg:flex xl:gap-3">
              {/* The home hero has its own search box, so the field waits until the visitor scrolls past it. */}
              <SearchField id="header-search-wide" placeholder="City or ZIP" className={`h-10 w-44 bg-bg xl:w-60 ${isHome && !scrolled ? "invisible" : ""}`} />
              <div className="flex min-w-[4.25rem] justify-center">
                {!authReady ? null : user ? (
                  <button type="button" onClick={handleLogout} className={`${NAV_LINK} ${NAV_IDLE}`}>
                    Log out
                  </button>
                ) : (
                  <Link href="/login" className={`${NAV_LINK} ${NAV_IDLE}`}>
                    Sign in
                  </Link>
                )}
              </div>
              <Link
                href="/get-quotes"
                className="flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-fun-pop"
              >
                <PawPrint weight="fill" className="h-4 w-4" />
                Get Free Quotes
              </Link>
            </div>

            {/* Phones: the links live in the tab bar and the menu. The top bar keeps search. */}
            <button
              type="button"
              ref={searchButton}
              onClick={() => setSearchOpen(!searchOpen)}
              aria-controls="header-search-row"
              aria-expanded={searchOpen}
              aria-label={searchOpen ? "Close search" : "Search groomers"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-primary shadow-[0_2px_8px_rgba(15,23,42,0.12)] lg:hidden"
            >
              {searchOpen ? <X weight="bold" className="h-5 w-5" /> : <MagnifyingGlass weight="bold" className="h-5 w-5" />}
            </button>

            {megaOpen && (
              <div
                id="nav-find"
                tabIndex={-1}
                className="animate-nav-dropdown absolute inset-x-0 top-full mt-2 hidden rounded-3xl bg-white p-5 outline-none xl:p-6 shadow-[0_22px_50px_rgba(15,23,42,0.24)] lg:block"
              >
                <NavMegaMenu cities={cities} onNavigate={() => setMegaOpen(false)} />
              </div>
            )}
          </div>

          {searchOpen && (
            <div id="header-search-row" className="pb-3 lg:hidden">
              <SearchField id="header-search-narrow" placeholder="City, ZIP, service or groomer" autoFocus className="h-12 bg-white" onSubmit={() => setSearchOpen(false)} />
            </div>
          )}
        </div>
      </header>

      <MobileNav pathname={pathname} signedIn={Boolean(user)} authReady={authReady} onLogout={handleLogout} />
    </>
  );
}
