"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        const supabase = createClient();
        const { error: updateErr } = await supabase.auth.updateUser({
            password,
        });

        if (updateErr) {
            setError(updateErr.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <div className="flex-1 flex flex-col bg-bg min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-sm text-center">
                    <CheckCircle weight="fill" className="w-16 h-16 text-brand-secondary mx-auto mb-4" />
                    <h1 className="font-heading text-2xl font-bold text-brand-primary mb-2">
                        Password updated
                    </h1>
                    <p className="text-text-muted text-sm mb-6">
                        Your password has been reset. You can now use it to sign in.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all"
                    >
                        Go to Dashboard
                        <ArrowRight weight="bold" className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-bg min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="font-heading text-2xl font-bold text-brand-primary mb-2">
                        Set a new password
                    </h1>
                    <p className="text-text-muted text-sm">
                        Choose a new password for your account.
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                    <form onSubmit={handleReset} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="new-password">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                placeholder="At least 6 characters"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="confirm-password">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                placeholder="Type it again"
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
                                {loading ? "Updating..." : "Update Password"}
                                {!loading && <ArrowRight weight="bold" className="w-4 h-4" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
