"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
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
  const [resetSent, setResetSent] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email address first, then click forgot password.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (resetErr) {
      setError(resetErr.message);
      return;
    }

    setResetSent(true);
    setTimeout(() => setResetSent(false), 8000);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
          {error}
        </div>
      )}

      {resetSent && (
        <div className="p-3 text-sm text-[#2E7D32] bg-[#E8F5E9] rounded-xl border border-[#A5D6A7]">
          Password reset link sent! Check your inbox.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text mb-1.5" htmlFor="login-email">
          Email Address
        </label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-text" htmlFor="login-password">
            Password
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs text-brand-accent hover:text-brand-primary transition-colors font-medium"
          >
            Forgot password?
          </button>
        </div>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
          placeholder="Your password"
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
