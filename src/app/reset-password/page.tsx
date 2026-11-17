import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { AuthShell, AUTH_BUTTON, AUTH_ERROR, AUTH_INPUT, AUTH_LABEL, Required } from "@/components/auth-shell";
import { safeRedirectPath } from "@/lib/safe-redirect";
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

    const nextPath = safeRedirectPath(formData.get("next"));
    const suffix = `&next=${encodeURIComponent(nextPath)}`;
    const password = formData.get("password")?.toString() ?? "";
    const confirm = formData.get("confirm")?.toString() ?? "";

    if (password !== confirm) {
        redirect(`/reset-password?error=mismatch${suffix}`);
    }
    if (password.length < 8) {
        redirect(`/reset-password?error=short${suffix}`);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        redirect(`/reset-password?error=failed${suffix}`);
    }

    redirect(`/reset-password?success=1${suffix}`);
}

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
    const { error, success, next } = await searchParams;
    const nextPath = safeRedirectPath(next);

    if (success) {
        return (
            <AuthShell title="Password updated" lead="Your password has been reset. You can now use it to sign in.">
                <Link href={nextPath} className={AUTH_BUTTON}>
                    Continue
                    <ArrowRight weight="bold" className="w-4 h-4" />
                </Link>
            </AuthShell>
        );
    }

    const errorMessage = resetErrorMessage(error);

    return (
        <AuthShell title="Set a new password" lead="Choose a new password for your account.">
            <form action={updatePassword} className="space-y-5">
                <input type="hidden" name="next" value={nextPath} />
                {errorMessage && (
                    <div role="alert" className={AUTH_ERROR}>
                        {errorMessage}
                    </div>
                )}

                <div>
                    <label className={AUTH_LABEL} htmlFor="new-password">
                        New password<Required />
                    </label>
                    <input
                        type="password"
                        id="new-password"
                        name="password"
                        autoComplete="new-password"
                        className={AUTH_INPUT}
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                    />
                </div>

                <div>
                    <label className={AUTH_LABEL} htmlFor="confirm-password">
                        Confirm password<Required />
                    </label>
                    <input
                        type="password"
                        id="confirm-password"
                        name="confirm"
                        autoComplete="new-password"
                        className={AUTH_INPUT}
                        placeholder="Type it again"
                        required
                        minLength={8}
                    />
                </div>

                <button type="submit" className={AUTH_BUTTON}>
                    Update password
                    <ArrowRight weight="bold" className="w-4 h-4" />
                </button>
            </form>
        </AuthShell>
    );
}
