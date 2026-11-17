import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: redirectTo, error: authError } = await searchParams;
  const nextPath = safeRedirectPath(redirectTo);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <AuthShell title="Sign in" lead="Use the email and password of your GroomLocal account.">
      <LoginForm
        redirectTo={nextPath}
        authError={authError}
        signupHref={`/signup?redirect=${encodeURIComponent(nextPath)}`}
      />
    </AuthShell>
  );
}
