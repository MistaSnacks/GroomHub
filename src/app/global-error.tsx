"use client";

import { useEffect } from "react";

/** Catches errors thrown by the root layout itself, which error.tsx cannot. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({ scope: "global-error", digest: error.digest, message: error.message }));
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FDF8F0", color: "#1E293B", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>GroomLocal is having a moment</h1>
            <p style={{ color: "#475569", marginBottom: 24 }}>
              Something went wrong loading the site. Please try again in a minute.
              {error.digest ? ` (reference ${error.digest})` : ""}
            </p>
            <button type="button" onClick={() => reset()} style={{ borderRadius: 999, background: "#1E293B", color: "#fff", padding: "12px 24px", border: 0, fontWeight: 700, cursor: "pointer" }}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
