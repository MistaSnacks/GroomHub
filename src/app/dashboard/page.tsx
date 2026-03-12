import Link from "next/link";
import { Storefront, PencilSimple, ArrowSquareOut, PlusCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getListingsByOwner } from "@/lib/supabase/queries";

const tierColors: Record<string, string> = {
  free: "bg-border text-text-muted",
  standard: "bg-blue-100 text-blue-700",
  featured: "bg-brand-accent/15 text-brand-accent",
  premium: "bg-brand-secondary/15 text-brand-secondary",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Layout handles redirect if no user, but guard just in case
  if (!user) return null;

  const listings = await getListingsByOwner(user.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
          Overview
        </h1>
        <p className="text-text-muted">{user.email}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-brand-primary">
          My Listings
        </h2>
        <Link
          href="/get-listed"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:text-brand-primary transition-colors"
        >
          <PlusCircle weight="bold" className="w-4 h-4" />
          Claim a Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Storefront weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-brand-primary mb-2">
            No listings yet
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
            Claim your grooming business to manage your profile, update your info, and connect with pet parents.
          </p>
          <Link
            href="/get-listed"
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all"
          >
            Get Listed
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <div
              key={listing.slug}
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-heading text-lg font-semibold text-brand-primary">
                  {listing.name}
                </h3>
                {listing.subscription_tier && (
                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 ${tierColors[listing.subscription_tier] || tierColors.free}`}>
                    {listing.subscription_tier}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted mb-1">
                {listing.city}, {listing.state}
              </p>
              {listing.claimed_at && (
                <p className="text-xs text-text-muted mb-4">
                  Claimed on {new Date(listing.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/listing/${listing.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-accent transition-colors"
                >
                  <PencilSimple weight="bold" className="w-4 h-4" />
                  Edit
                </Link>
                <Link
                  href={`/groomer/${listing.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-brand-primary transition-colors"
                >
                  <ArrowSquareOut weight="bold" className="w-4 h-4" />
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
