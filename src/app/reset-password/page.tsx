import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

function resetErrorMessage(code: string | undefined): string | null {
    if (!code) return null;
    if (code === "mismatch") return "Passwords do not match.";
    if (code === "short") return "Password must be at least 8 characters.";
    return "Something went wrong. Please try again.";
}

async function updatePassword(formData: FormData) {
    "use server";

    const password = formData.get("password")?.toString() ?? "";
    const confirm = formData.get("confirm")?.toString() ?? "";

    if (password !== confirm) {
        redirect("/reset-password?error=mismatch");
    }
    if (password.length < 8) {
        redirect("/reset-password?error=short");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        redirect("/reset-password?error=failed");
    }

    redirect("/reset-password?success=1");
}

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; success?: string }>;
}) {
    const { error, success } = await searchParams;

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

    const errorMessage = resetErrorMessage(error);

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
                    <form action={updatePassword} className="space-y-4">
                        {errorMessage && (
                            <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
                                {errorMessage}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="new-password">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                name="password"
                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                placeholder="At least 8 characters"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="confirm-password">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirm-password"
                                name="confirm"
                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                                placeholder="Type it again"
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-2 w-full rounded-full bg-brand-primary px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md"
                            >
                                Update Password
                                <ArrowRight weight="bold" className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
