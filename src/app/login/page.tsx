import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: redirectTo } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo || "/dashboard");
  }

  return (
    <div className="flex flex-col flex-1 bg-bg min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden border-[2.5px] border-brand-secondary flex-shrink-0">
              <Image src="/maui-logo.svg" alt="GroomLocal" width={48} height={48} className="h-full w-full object-cover" />
            </div>
            <span className="font-heading text-2xl font-bold text-brand-primary">GroomLocal</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-brand-primary mb-1 text-center">
            Welcome back
          </h1>
          <p className="text-sm text-text-muted text-center mb-6">
            Sign in to manage your listings
          </p>

          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="text-sm text-text-muted text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-brand-primary hover:text-brand-accent transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
