"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { useTurnstile, TURNSTILE_NOT_READY } from "@/components/turnstile";
import { AUTH_BUTTON, AUTH_ERROR, AUTH_INPUT, AUTH_LABEL, AUTH_LINK, AUTH_SUCCESS, Required } from "@/components/auth-shell";

interface LoginFormProps {
  redirectTo?: string;
  authError?: string;
  signupHref: string;
}

function mapAuthError(code: string): string {
  if (code === "access_denied") {
    return "Access was denied. Sign in below or request a new link.";
  }
  if (code === "otp_expired") {
    return "That confirmation link has expired. Request a new one.";
  }
  return "That link is invalid or has expired. Request a new one.";
}

export function LoginForm({ redirectTo, authError, signupHref }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    authError ? mapAuthError(authError) : null
  );
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const captcha = useTurnstile("login");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha.ready) {
      setError(TURNSTILE_NOT_READY);
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captcha.token },
    });
    captcha.reset();

    if (signInErr) {
      setError(signInErr.message);
      setLoading(false);
      return;
    }

    router.push(safeRedirectPath(redirectTo));
    router.refresh();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email address first, then click forgot password.");
      return;
    }
    if (!captcha.ready) {
      setError(TURNSTILE_NOT_READY);
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken: captcha.token,
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(`/reset-password?next=${encodeURIComponent(safeRedirectPath(redirectTo))}`)}`,
    });

    captcha.reset();
    setLoading(false);

    if (resetErr) {
      setError(resetErr.message);
      return;
    }

    setResetSent(true);
    setTimeout(() => setResetSent(false), 8000);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div role="alert" className={AUTH_ERROR}>
            {error}
          </div>
        )}

        {resetSent && (
          <div role="status" className={AUTH_SUCCESS}>
            Password reset link sent! Check your inbox.
          </div>
        )}

        <div>
          <label className={AUTH_LABEL} htmlFor="login-email">
            Email<Required />
          </label>
          <input
            type="email"
            autoComplete="email"
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className={AUTH_LABEL} htmlFor="login-password">
            Password<Required />
          </label>
          <input
            type="password"
            autoComplete="current-password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={AUTH_INPUT}
            placeholder="Your password"
            required
            minLength={8}
          />
        </div>

        {captcha.widget}

        <button type="submit" disabled={loading} className={AUTH_BUTTON}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-6 text-base">
        <button type="button" onClick={handleForgotPassword} disabled={loading} className={AUTH_LINK}>
          Forgot your password?
        </button>
        <p className="text-slate-600">
          New here?{" "}
          <Link href={signupHref} className={AUTH_LINK}>
            Create an account
          </Link>
        </p>
      </div>
    </>
  );
}
