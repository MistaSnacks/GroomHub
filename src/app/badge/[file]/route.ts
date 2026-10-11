import { after, NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LISTING_REDIRECTS, PUBLIC_EXCLUDED_SLUGS } from "@/lib/listing-review";
import { badgeHostFromReferer, badgeSvg, badgeVariant, slugFromBadgeFile } from "@/lib/badge";

export const dynamic = "force-dynamic";

// GET /badge/<slug>.svg — the image owners embed on their own websites.
// Served fresh to the CDN (private) so every first load per browser reaches this
// handler and records which website shows the badge. Browsers keep it for a day.
export async function GET(request: NextRequest, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const requested = slugFromBadgeFile(file);
  if (!requested) return new NextResponse("Not found", { status: 404 });
  const slug = LISTING_REDIRECTS[requested] ?? requested;
  if (PUBLIC_EXCLUDED_SLUGS.includes(slug)) return new NextResponse("Not found", { status: 404 });

  const db = createAdminClient();
  const { data: listing, error } = await db.from("business_listings").select("id, owner_id, is_featured, sponsor_paid_until").eq("slug", slug).maybeSingle();
  if (error) {
    console.error(JSON.stringify({ scope: "badge", event: "listing_lookup_failed", slug, message: error.message }));
    return new NextResponse("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!listing) return new NextResponse("Not found", { status: 404 });

  const host = badgeHostFromReferer(request.headers.get("referer"));
  if (host) {
    after(async () => {
      const { error: hitError } = await db.rpc("record_badge_hit", { p_listing_id: listing.id, p_host: host });
      if (hitError) console.error(JSON.stringify({ scope: "badge", event: "hit_record_failed", slug, message: hitError.message }));
    });
  }

  return new NextResponse(badgeSvg(badgeVariant(listing)), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, max-age=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
