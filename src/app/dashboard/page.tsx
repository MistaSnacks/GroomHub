import Link from "next/link";
import { cookies } from "next/headers";
import { Storefront, PencilSimple, ArrowSquareOut, PlusCircle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getListingsByOwner } from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBanner } from "./status-banner";

const tierColors: Record<string, string> = {
  free: "bg-border text-text-muted",
  basic: "bg-brand-accent/15 text-brand-accent",
  premium: "bg-brand-secondary/15 text-brand-secondary",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; "account-deleted"?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Layout handles redirect if no user, but guard just in case
  if (!user) return null;

  const listings = await getListingsByOwner(user.id);

  // A signed-in owner with no listing usually got here mid-claim (the email
  // confirmation link sometimes lands on the homepage). Find the listing they
  // were claiming: the cookie set by the claim form, or a public listing whose
  // stored email matches their account.
  let pendingClaim: { slug: string; name: string } | null = null;
  let underReview: { slug: string; name: string } | null = null;
  if (listings.length === 0) {
    const admin = createAdminClient();
    const { data: review } = await admin
      .from("claim_requests")
      .select("listing_slug, business_listings(name)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (review) {
      const rel = review.business_listings as { name?: string } | { name?: string }[] | null;
      const name = Array.isArray(rel) ? rel[0]?.name : rel?.name;
      underReview = { slug: review.listing_slug as string, name: name ?? (review.listing_slug as string) };
    }

    if (!underReview) {
      const cookieStore = await cookies();
      const cookieSlug = cookieStore.get("gl_pending_claim")?.value;
      // Two plain queries; never interpolate user-controlled strings into a filter expression.
      if (cookieSlug && /^[a-z0-9-]{1,120}$/.test(cookieSlug)) {
        const { data } = await supabase.from("business_listings").select("slug,name").eq("slug", cookieSlug).is("owner_id", null).maybeSingle();
        if (data) pendingClaim = { slug: data.slug, name: data.name };
      }
      if (!pendingClaim && user.email) {
        const { data } = await supabase.from("business_listings").select("slug,name").eq("email", user.email.toLowerCase()).is("owner_id", null).limit(1).maybeSingle();
        if (data) pendingClaim = { slug: data.slug, name: data.name };
      }
    }
  }

  const errorMessage =
    params.error === "not-authorized"
      ? "You are not authorized to edit that listing."
      : params.error
        ? params.error
        : null;
  const successMessage =
    params.success === "updated"
      ? "Listing updated successfully."
      : params["account-deleted"] === "true"
        ? "Your account has been deleted."
        : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6">
      {errorMessage && <StatusBanner variant="error" message={errorMessage} />}
      {successMessage && <StatusBanner variant="success" message={successMessage} />}
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
          href="/search"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:text-brand-primary transition-colors"
        >
          <PlusCircle weight="bold" className="w-4 h-4" />
          Claim a Listing
        </Link>
      </div>

      {listings.length === 0 && underReview ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Storefront weight="duotone" className="w-12 h-12 text-brand-accent mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-brand-primary mb-2">
            Your claim for {underReview.name} is under review
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
            A person is verifying that you represent this business. You will get an email when editing is unlocked, usually within one business day.
          </p>
          <Link href={`/groomer/${underReview.slug}`} className="text-sm underline text-brand-primary">View the listing</Link>
        </div>
      ) : listings.length === 0 && pendingClaim ? (
        <div className="bg-white rounded-2xl border border-brand-accent/40 p-10 text-center">
          <Storefront weight="duotone" className="w-12 h-12 text-brand-accent mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-brand-primary mb-2">
            Finish claiming {pendingClaim.name}
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
            Your account is ready. One more click confirms your free listing and unlocks editing, photos, and inquiries.
          </p>
          <Link
            href={`/claim/${pendingClaim.slug}/plans`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all"
          >
            Confirm Free Listing
          </Link>
          <p className="text-xs text-text-muted mt-4">
            Not your business? <Link href="/search" className="underline">Find your listing</Link>
          </p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Storefront weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-brand-primary mb-2">
            No listings yet
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
            Find your grooming business in the directory and click Claim on its profile to manage your listing, photos, and inquiries.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-primary/90 transition-all"
          >
            Find My Business
          </Link>
          <p className="text-xs text-text-muted mt-4">
            Not listed yet? <Link href="/get-listed" className="underline">Request a new listing</Link>
          </p>
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
                  Claimed on {new Date(listing.claimed_at).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" })}
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
