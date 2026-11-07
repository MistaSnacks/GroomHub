"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export const TURNSTILE_NOT_READY =
  "The security check is still loading. Wait a moment and try again.";

/**
 * Cloudflare Turnstile, invisible unless Cloudflare wants an interaction.
 * Tokens are single-use: call reset() after every submit that sent one.
 * Without NEXT_PUBLIC_TURNSTILE_SITE_KEY this is a no-op and `token` stays undefined.
 * Pass active=false to delay loading Cloudflare's script (for example until the form gets focus).
 */
export function useTurnstile(action: string, active = true) {
  const [token, setToken] = useState<string | null>(null);
  // A callback ref, so a form that swaps screens gets a fresh widget on each mount.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !active || !container) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        widgetId.current = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          action,
          appearance: "interaction-only",
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(null),
          "error-callback": () => setToken(null),
        });
      })
      .catch(() => setToken(null));
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
      setToken(null);
    };
  }, [action, active, container]);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, []);

  return {
    /** False only while a configured widget has not produced a token yet. */
    ready: !SITE_KEY || token !== null,
    token: token ?? undefined,
    reset,
    widget: SITE_KEY ? <div ref={setContainer} className="flex justify-center empty:hidden" /> : null,
  };
}
