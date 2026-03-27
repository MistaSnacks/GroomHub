import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getListingBySlug } from "@/lib/supabase/queries";
import { EditListingClient } from "./edit-listing-client";

interface EditListingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function EditListingPage({ params, searchParams }: EditListingPageProps) {
  const { slug } = await params;
  const { error, success } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  if (listing.owner_id !== user.id) {
    redirect("/dashboard?error=not-authorized");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6 max-w-2xl">
      <div className="mb-2">
        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
          Edit {listing.name}
        </h1>
        <Link
          href={`/groomer/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-primary transition-colors"
        >
          <ArrowSquareOut weight="bold" className="w-4 h-4" />
          View public profile
        </Link>
      </div>

      {error && (
        <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
          {error}
        </div>
      )}
      {success === "updated" && (
        <div className="p-3 text-sm text-brand-primary bg-brand-secondary/10 rounded-xl border border-brand-secondary/30">
          Listing updated successfully.
        </div>
      )}

      <EditListingClient
        slug={listing.slug}
        name={listing.name}
        description={listing.description}
        shortDescription={listing.short_description}
        phone={listing.phone}
        email={listing.email || ""}
        website={listing.website || ""}
        address={listing.address}
        city={listing.city}
        state={listing.state}
        zip={listing.zip}
        services={listing.services}
        specialties={listing.specialties}
        hours={listing.hours || []}
      />
    </div>
  );
}
