"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { WaveDivider } from "@/components/wave-divider";

export default function SignupPage() {
    return <Suspense fallback={<div className="p-12 text-center">Loading signup…</div>}><SignupForm /></Suspense>;
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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
        const supabase = createClient();
        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            },
        });

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
        <div className="flex-1 flex flex-col bg-bg">
            <section className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
                            Create an account
                        </h1>
                        <p className="text-text-muted">
                            Create a free groomer account, then find or add your business.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="p-4 text-sm text-[#2E7D32] bg-[#E8F5E9] rounded-xl border border-[#A5D6A7]">
                                    Success! Please check your email to verify your account.
                                </div>
                                <Link
                                    href={loginHref}
                                    className="block w-full rounded-full border border-brand-primary px-6 py-3.5 text-sm font-bold text-brand-primary transition-all hover:bg-brand-primary/5"
                                >
                                    Return to Login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSignup} className="space-y-5">
                                {error && (
                                    <div role="alert" className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1.5" htmlFor="email">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                        placeholder="owner@business.com"
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
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        required
                                        minLength={8}
                                    />
                                </div>

                                <p className="text-xs text-text-muted">Use at least 8 characters. By signing up, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full rounded-full bg-brand-primary px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center"
                                    >
                                        {loading ? "Creating account..." : "Sign Up"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {!success && (
                            <p className="text-sm text-center text-text-muted mt-6">
                                Already have an account?{" "}
                                <Link href={loginHref} className="text-brand-primary font-semibold hover:underline">
                                    Log in
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </section>
            <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
        </div>
    );
}
