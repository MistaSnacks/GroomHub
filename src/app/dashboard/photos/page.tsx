import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLimits } from "@/lib/tiers";
import { PhotosClient } from "./photos-client";

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("business_listings")
    .select("id, slug, images, logo_url, subscription_tier, owner_id")
    .eq("owner_id", user.id);

  if (params.id) {
    query = query.eq("id", params.id);
  }

  const { data: listings } = await query;
  const listing = listings?.[0];

  if (!listing) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <h2 className="text-xl font-bold text-brand-primary mb-2">No listing found</h2>
          <p className="text-text-muted">You do not have access to edit this listing, or it does not exist.</p>
        </div>
      </div>
    );
  }

  const limits = getLimits(listing.subscription_tier);
  const currentImages = (listing.images || []).filter(
    (img: string) =>
      !img.includes("unsplash.com") &&
      !img.includes("pexels.com") &&
      !img.includes("placehold.co") &&
      !img.includes("placeholder")
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
          Photos
        </h1>
        <p className="text-text-muted">
          Manage your business logo and gallery images.
        </p>
      </div>

      <PhotosClient
        listingId={listing.id}
        currentImages={currentImages}
        logoUrl={listing.logo_url || null}
        maxPhotos={limits.photos}
      />
    </div>
  );
}
