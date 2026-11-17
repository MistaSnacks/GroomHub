"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowRight, BookOpen, List, MapPin, PawPrint, Scissors, X } from "@phosphor-icons/react/dist/ssr";

const TAB = "flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold leading-none";
const SMALL = "block py-1.5 text-left text-base font-medium";

const BIG_LINKS = [
  { href: "/dog-grooming", label: "Find a groomer" },
  { href: "/services", label: "Services" },
  { href: "/specialties", label: "Specialties" },
  { href: "/blog", label: "Grooming Guides" },
];

function under(pathname: string, root: string) {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/**
 * The phone navigation: a tab bar at the bottom of the screen and a full-screen menu.
 * Both render next to the site header, not inside it: a blurred header would trap a fixed child.
 */
export function MobileNav({
  pathname,
  signedIn,
  authReady,
  onLogout,
}: {
  pathname: string;
  signedIn: boolean;
  authReady: boolean;
  onLogout: () => void;
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const menuTab = useRef<HTMLButtonElement>(null);
  const close = () => sheet.current?.close();

  // The sheet is for narrow screens only. A modal that stays open after the screen gets wide would freeze the page.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (wide.matches) sheet.current?.close();
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  const tabs = [
    { href: "/dog-grooming", label: "Cities", Icon: MapPin },
    { href: "/services", label: "Services", Icon: Scissors },
    null,
    { href: "/blog", label: "Guides", Icon: BookOpen },
  ];

  return (
    <>
      <nav
        aria-label="Quick links"
        className="site-tabs fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 bg-white px-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(15,23,42,0.1)] lg:hidden"
      >
        {tabs.map((tab) => {
          if (!tab) {
            return (
              <Link key="quotes" href="/get-quotes" className={`${TAB} h-16 justify-end pb-2.5 text-brand-primary`}>
                <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-brand-accent shadow-[0_6px_16px_rgba(255,126,103,0.5)]">
                  <PawPrint weight="fill" className="h-6 w-6" />
                </span>
                Quotes
              </Link>
            );
          }
          const active = under(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`${TAB} h-16 ${active ? "text-[#0F766E]" : "text-slate-600"}`}
            >
              <tab.Icon weight={active ? "fill" : "regular"} className="h-[22px] w-[22px]" />
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          ref={menuTab}
          aria-haspopup="dialog"
          aria-controls="site-menu"
          onClick={() => sheet.current?.showModal()}
          className={`${TAB} h-16 text-slate-600`}
        >
          <List weight="bold" className="h-[22px] w-[22px]" />
          Menu
        </button>
      </nav>

      <dialog
        ref={sheet}
        id="site-menu"
        aria-label="Site menu"
        onClose={() => menuTab.current?.focus()}
        className="nav-sheet paws m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-brand-secondary p-0 text-brand-primary"
      >
        <div className="flex min-h-full flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex h-[72px] shrink-0 items-center justify-between">
            <Link href="/" onClick={close} className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-[2.5px] border-white bg-white">
                <Image src="/maui-logo-circle.svg" alt="" width={40} height={40} className="h-full w-full object-cover" />
              </span>
              <span className="font-heading text-xl font-bold leading-tight tracking-[-0.02em]">GroomLocal</span>
            </Link>
            <button
              type="button"
              autoFocus
              onClick={close}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]"
            >
              <X weight="bold" className="h-5 w-5" />
            </button>
          </div>

          <nav aria-label="Site menu">
            {BIG_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="flex items-center justify-between border-b-[1.5px] border-white/55 py-3.5 font-heading text-[1.7rem] font-semibold leading-none"
              >
                {label}
                <ArrowRight weight="bold" className="h-5 w-5" />
              </Link>
            ))}
          </nav>

          <div className="relative mt-4 flex-1">
            <ul className="min-h-[9.5rem]">
              {authReady && signedIn ? (
                <>
                  <li><Link href="/dashboard" onClick={close} className={SMALL}>Dashboard</Link></li>
                  <li>
                    <button type="button" onClick={() => { close(); onLogout(); }} className={SMALL}>
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li><Link href="/for-groomers" onClick={close} className={SMALL}>For Groomers</Link></li>
                  <li><Link href="/login" onClick={close} className={SMALL}>Sign in</Link></li>
                </>
              )}
              <li><Link href="/about" onClick={close} className={SMALL}>About</Link></li>
              <li><Link href="/contact" onClick={close} className={SMALL}>Contact</Link></li>
            </ul>
            <Image
              src="/maui-assets/00-maui-main.png?v=maui-20260904-alpha1"
              alt=""
              width={320}
              height={320}
              sizes="160px"
              className="pointer-events-none absolute bottom-0 right-0 aspect-square w-40 select-none object-contain [@media(max-height:620px)]:hidden"
            />
          </div>

          <Link
            href="/get-quotes"
            onClick={close}
            className="mt-4 flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-4 text-lg font-semibold text-white"
          >
            <PawPrint weight="fill" className="h-5 w-5" />
            Get Free Quotes
          </Link>
        </div>
      </dialog>
    </>
  );
}
