"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, EnvelopeSimple, ArrowCounterClockwise } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/browser";

interface ClaimFormProps {
    listingSlug: string;
    listingName: string;
}

type Mode = "signup" | "signin";
type Status = "idle" | "loading" | "confirm-email";

export function ClaimForm({ listingSlug, listingName }: ClaimFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [mode, setMode] = useState<Mode>("signup");
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const redirectUrl = `${typeof window !== "undefined" ? location.origin : ""}/auth/callback?next=/claim/${listingSlug}/plans`;

    const handleSignUp = async (): Promise<"navigated" | "confirm-email" | "error"> => {
        const supabase = createClient();
        const { error: signUpErr, data } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectUrl },
        });

        if (signUpErr) {
            if (signUpErr.message.toLowerCase().includes("already registered")) {
                setError("An account with this email already exists. Try signing in instead.");
                setMode("signin");
                return "error";
            }
            setError(signUpErr.message);
            return "error";
        }

        if (data.session) {
            router.push(`/claim/${listingSlug}/plans`);
            router.refresh();
            return "navigated";
        }

        setStatus("confirm-email");
        return "confirm-email";
    };

    const handleSignIn = async (): Promise<"navigated" | "confirm-email" | "error"> => {
        const supabase = createClient();
        const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInErr) {
            if (signInErr.message.toLowerCase().includes("email not confirmed")) {
                setStatus("confirm-email");
                return "confirm-email";
            }
            setError(signInErr.message);
            return "error";
        }

        router.push(`/claim/${listingSlug}/plans`);
        router.refresh();
        return "navigated";
    };

    const handleResendConfirmation = async () => {
        if (!email) return;
        setResending(true);
        const supabase = createClient();
        await supabase.auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo: redirectUrl },
        });
        setResending(false);
        setResent(true);
        setTimeout(() => setResent(false), 5000);
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Enter your email address first, then click forgot password.");
            return;
        }
        const supabase = createClient();
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
        });
        if (resetErr) {
            setError(resetErr.message);
            return;
        }
        setError(null);
        setStatus("confirm-email");
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        setStatus("loading");
        setError(null);

        let navigated = false;
        let confirmEmail = false;

        try {
            if (mode === "signup") {
                const outcome = await handleSignUp();
                if (outcome === "navigated") navigated = true;
                if (outcome === "confirm-email") confirmEmail = true;
            } else {
                const outcome = await handleSignIn();
                if (outcome === "navigated") navigated = true;
                if (outcome === "confirm-email") confirmEmail = true;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            if (!navigated && !confirmEmail) setStatus("idle");
        }
    };

    // Confirmation email sent state
    if (status === "confirm-email") {
        return (
            <div className="space-y-4">
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7]">
                    <EnvelopeSimple weight="duotone" className="w-10 h-10 text-[#2E7D32] mb-3" />
                    <p className="text-sm font-semibold text-[#2E7D32] mb-1">
                        Check your inbox
                    </p>
                    <p className="text-sm text-[#2E7D32]/80">
                        We sent a verification link to <strong>{email}</strong>. Click it to continue claiming {listingName}.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleResendConfirmation}
                        disabled={resending || resent}
                        className="flex items-center justify-center gap-1.5 w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-brand-primary hover:border-brand-primary/30 transition-colors disabled:opacity-50"
                    >
                        <ArrowCounterClockwise weight="bold" className="w-3.5 h-3.5" />
                        {resent ? "Sent! Check your inbox" : resending ? "Resending..." : "Resend verification email"}
                    </button>

                    <button
                        onClick={() => {
                            setStatus("idle");
                            setError(null);
                        }}
                        className="text-xs text-text-muted hover:text-brand-primary transition-colors"
                    >
                        Use a different email
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
                    {error}
                </div>
            )}

            {/* Mode toggle */}
            <div className="flex rounded-xl border border-border overflow-hidden">
                <button
                    type="button"
                    onClick={() => { setMode("signup"); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        mode === "signup"
                            ? "bg-brand-primary text-white"
                            : "bg-white text-text-muted hover:text-brand-primary"
                    }`}
                >
                    New account
                </button>
                <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        mode === "signin"
                            ? "bg-brand-primary text-white"
                            : "bg-white text-text-muted hover:text-brand-primary"
                    }`}
                >
                    Existing account
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-text mb-1.5" htmlFor="claim-email">
                    Email Address
                </label>
                <input
                    type="email"
                    id="claim-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    placeholder="owner@business.com"
                    required
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-text" htmlFor="claim-password">
                        Password
                    </label>
                    {mode === "signin" && (
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-xs text-brand-accent hover:text-brand-primary transition-colors font-medium"
                        >
                            Forgot password?
                        </button>
                    )}
                </div>
                <input
                    type="password"
                    name="password"
                    id="claim-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    placeholder={mode === "signup" ? "Create a password (8+ characters)" : "Your password"}
                    required
                    minLength={8}
                />
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-brand-primary px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md disabled:opacity-70 disabled:hover:scale-100"
                >
                    {status === "loading"
                        ? "Authenticating..."
                        : mode === "signup"
                            ? "Create Account & Continue"
                            : "Sign In & Continue"}
                    {status !== "loading" && <ArrowRight weight="bold" className="w-4 h-4" />}
                </button>
            </div>
        </form>
    );
}
