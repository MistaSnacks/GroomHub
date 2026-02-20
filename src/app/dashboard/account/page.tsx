import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, EnvelopeSimple, SignOut } from "@phosphor-icons/react/dist/ssr";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
      <div className="mb-4">
        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
          Account
        </h1>
        <p className="text-text-muted">Manage your GroomHub account settings.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden max-w-2xl">
        <div className="p-6 border-b border-border bg-gray-50/50 flex items-center gap-3">
          <User className="w-5 h-5 text-brand-secondary" weight="duotone" />
          <h2 className="font-heading text-lg font-bold text-brand-primary">
            Account Details
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 block">
              Email
            </label>
            <div className="flex items-center gap-2 text-sm text-text">
              <EnvelopeSimple className="w-4 h-4 text-text-muted" />
              {user.email}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 block">
              Account Created
            </label>
            <p className="text-sm text-text">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <form action="/api/auth/signout" method="POST">
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <SignOut weight="bold" className="w-4 h-4" />
                Sign Out
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
