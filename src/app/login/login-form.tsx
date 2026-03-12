"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/browser";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      setError(signInErr.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo || "/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text mb-1.5" htmlFor="email">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1.5" htmlFor="password">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-full bg-brand-primary px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? "Signing in..." : "Log in"}
          {!loading && <ArrowRight weight="bold" className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}
