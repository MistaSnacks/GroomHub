"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { useTurnstile, TURNSTILE_NOT_READY } from "@/components/turnstile";
import { AuthShell, AUTH_BUTTON, AUTH_ERROR, AUTH_INPUT, AUTH_LABEL, AUTH_LINK, AUTH_SUCCESS, Required } from "@/components/auth-shell";

export default function SignupPage() {
    return <Suspense fallback={<AuthShell title="Create an account" lead="Create a free groomer account, then find or add your business."><div className="h-64" /></AuthShell>}><SignupForm /></Suspense>;
}

function SignupForm() {
    const searchParams = useSearchParams();
    const nextPath = safeRedirectPath(searchParams.get("redirect"), "/get-listed");
    const loginHref = `/login?redirect=${encodeURIComponent(nextPath)}`;
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const captcha = useTurnstile("signup");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!captcha.ready) {
            setError(TURNSTILE_NOT_READY);
            return;
        }
        setLoading(true);
        setError(null);

        try {
        const supabase = createClient();
        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
                captchaToken: captcha.token,
            },
        });
        captcha.reset();

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            if (data?.session) {
                // Auto-login if email confirm is off
                router.push(nextPath);
                router.refresh();
            } else {
                setSuccess(true);
                setLoading(false);
            }
        }
        } catch {
            setError("Unable to connect. Please try again.");
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Create an account" lead="Create a free groomer account, then find or add your business.">
            {success ? (
                <div className="space-y-5">
                    <div role="status" className={AUTH_SUCCESS}>
                        Success! Please check your email to verify your account.
                    </div>
                    <Link href={loginHref} className={AUTH_BUTTON}>
                        Return to Login
                    </Link>
                </div>
            ) : (
                <>
                    <form onSubmit={handleSignup} className="space-y-5">
                        {error && (
                            <div role="alert" className={AUTH_ERROR}>
                                {error}
                            </div>
                        )}
                        <div>
                            <label className={AUTH_LABEL} htmlFor="email">
                                Email<Required />
                            </label>
                            <input
                                type="email"
                                autoComplete="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={AUTH_INPUT}
                                placeholder="owner@business.com"
                                required
                            />
                        </div>
                        <div>
                            <label className={AUTH_LABEL} htmlFor="password">
                                Password<Required />
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={AUTH_INPUT}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                required
                                minLength={8}
                            />
                        </div>

                        <p className="text-sm text-slate-600">Use at least 8 characters. By signing up, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
                        {captcha.widget}
                        <button type="submit" disabled={loading} className={AUTH_BUTTON}>
                            {loading ? "Creating account..." : "Sign up"}
                        </button>
                    </form>

                    <p className="mt-6 border-t border-border pt-6 text-base text-slate-600">
                        Already have an account?{" "}
                        <Link href={loginHref} className={AUTH_LINK}>
                            Sign in
                        </Link>
                    </p>
                </>
            )}
        </AuthShell>
    );
}
