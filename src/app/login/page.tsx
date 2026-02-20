"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { WaveDivider } from "@/components/wave-divider";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-bg">
            <section className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
                            Welcome back
                        </h1>
                        <p className="text-text-muted">
                            Log in to manage your grooming business
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                        <form onSubmit={handleLogin} className="space-y-5">
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
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-full bg-brand-primary px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center"
                                >
                                    {loading ? "Logging in..." : "Log In"}
                                </button>
                            </div>
                        </form>

                        <p className="text-sm text-center text-text-muted mt-6">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-brand-primary font-semibold hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
            <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
        </div>
    );
}
