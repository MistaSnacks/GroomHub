import { createClient } from "@/lib/supabase/server";
import { getListingsByOwner } from "@/lib/supabase/queries";
import { SettingsClient } from "./settings-client";

interface SettingsPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { error, success } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const listings = await getListingsByOwner(user.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6 max-w-2xl">
      <div className="mb-2">
        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
          Settings
        </h1>
      </div>

      {error && (
        <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
          {error}
        </div>
      )}
      {success === "password-updated" && (
        <div className="p-3 text-sm text-brand-primary bg-brand-secondary/10 rounded-xl border border-brand-secondary/30">
          Password updated successfully.
        </div>
      )}

      <SettingsClient
        userEmail={user.email || ""}
        listings={listings.map((l) => ({
          slug: l.slug,
          name: l.name,
          subscription_tier: l.subscription_tier || "free",
        }))}
      />
    </div>
  );
}
