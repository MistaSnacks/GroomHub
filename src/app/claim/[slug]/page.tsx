import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, ShieldCheck, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getListingBySlug } from "@/lib/supabase/queries";
import { WaveDivider } from "@/components/wave-divider";
import { ClaimForm } from "./claim-form";
import { createClient } from "@/lib/supabase/server";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already claimed (basic check)
  if (listing.owner_id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-bg">
        <ShieldCheck weight="duotone" className="w-16 h-16 text-brand-primary mb-4" />
        <h1 className="font-heading text-2xl font-bold text-brand-primary mb-2">
          This listing is already claimed
        </h1>
        <p className="text-text-muted mb-6">
          {listing.name} is currently managed by an owner.
        </p>
        <Link
          href={`/groomer/${listing.slug}`}
          className="px-6 py-2 rounded-full bg-brand-primary text-white font-medium hover:bg-brand-primary/90"
        >
          Return to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header section */}
      <section className="bg-bg py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
            Claim Your Business
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-brand-primary mb-4">
            Hello, {listing.name}!
          </h1>
          <p className="text-lg text-text-muted">
            Claiming your free profile allows you to reply to reviews, update your hours, and control your reputation.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Main Content */}
      <section className="bg-white py-12 flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-2 gap-8 items-start">

            {/* Left: Summary card */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sticky top-24">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-secondary/20 flex items-center justify-center shrink-0 relative">
                  {listing.images?.[0] ? (
                    <Image src={listing.images[0]} alt={listing.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <span className="font-heading text-2xl text-brand-primary font-bold">{listing.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-brand-primary">{listing.name}</h3>
                  <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {listing.city}, {listing.state}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-brand-primary text-sm">Why claim this profile?</h4>
                <ul className="space-y-3">
                  <li className="flex gap-2 text-sm text-text">
                    <Check weight="bold" className="w-4 h-4 text-brand-accent mt-0.5" />
                    Take control of your business info and hours
                  </li>
                  <li className="flex gap-2 text-sm text-text">
                    <Check weight="bold" className="w-4 h-4 text-brand-accent mt-0.5" />
                    Respond to pet parent reviews
                  </li>
                  <li className="flex gap-2 text-sm text-text">
                    <Check weight="bold" className="w-4 h-4 text-brand-accent mt-0.5" />
                    Optionally upgrade to remove competitor ads
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Steps / Auth Mock */}
            <div className="space-y-8">

              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
                {/* Step indicator */}
                <div className="absolute top-0 right-0 bg-brand-secondary/20 px-4 py-1.5 rounded-bl-xl text-xs font-bold text-brand-primary">
                  Step 1 of 2
                </div>

                {user ? (
                  <>
                    <h2 className="font-heading text-xl font-bold text-brand-primary mb-2">
                      Ready to claim?
                    </h2>
                    <p className="text-sm text-text-muted mb-6">
                      You are signed in as <span className="font-semibold text-brand-primary">{user.email}</span>.
                    </p>

                    <Link
                      href={`/claim/${listing.slug}/plans`}
                      className="flex items-center justify-center gap-2 w-full rounded-full bg-brand-primary px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md"
                    >
                      Continue to Step 2
                      <ArrowRight weight="bold" className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="font-heading text-xl font-bold text-brand-primary mb-2">
                      Create a free owner account
                    </h2>
                    <p className="text-sm text-text-muted mb-6">
                      We'll link this profile to your new account.
                    </p>

                    <ClaimForm listingSlug={listing.slug} listingName={listing.name} />
                  </>
                )}

                <p className="text-xs text-center text-text-muted mt-6">
                  By claiming this profile, you agree to our <a href="/terms" className="text-brand-accent hover:underline">Terms of Service</a> and <a href="/privacy" className="text-brand-accent hover:underline">Privacy Policy</a>, and verify you are an authorized representative of {listing.name}.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
