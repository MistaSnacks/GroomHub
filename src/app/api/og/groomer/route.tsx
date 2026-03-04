import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getListingBySlug } from "@/lib/supabase/queries";
import { getServiceLabel } from "@/lib/tags";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) {
      return new Response("Missing slug parameter", { status: 400 });
    }

    const listing = await getListingBySlug(slug);
    if (!listing) {
      return new Response("Listing not found", { status: 404 });
    }

    const services = listing.service_tags.slice(0, 3).map(getServiceLabel);
    const location = `${listing.city}, ${listing.state}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FDF8F0",
          }}
        >
          {/* Top brand bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 48px",
              backgroundColor: "#1E293B",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#4ECDC4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                🐾
              </div>
              <span style={{ fontSize: "24px", color: "#FFFFFF", fontWeight: 600 }}>
                GroomLocal
              </span>
            </div>
            <span style={{ fontSize: "14px", color: "#94A3B8", letterSpacing: "0.05em" }}>
              PET GROOMING DIRECTORY
            </span>
          </div>

          {/* Main content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "48px",
              gap: "20px",
            }}
          >
            <div
              style={{
                fontSize: listing.name.length > 30 ? "42px" : "52px",
                color: "#1E293B",
                lineHeight: 1.1,
                fontWeight: 700,
              }}
            >
              {listing.name}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "24px",
                color: "#64748B",
              }}
            >
              📍 {location}
            </div>

            {services.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
                {services.map((s) => (
                  <div
                    key={s}
                    style={{
                      backgroundColor: "rgba(78, 205, 196, 0.15)",
                      color: "#0D9488",
                      borderRadius: "999px",
                      padding: "8px 20px",
                      fontSize: "18px",
                      fontWeight: 500,
                      border: "1px solid rgba(78, 205, 196, 0.3)",
                    }}
                  >
                    {s}
                  </div>
                ))}
                {listing.service_tags.length > 3 && (
                  <div style={{ color: "#94A3B8", padding: "8px 12px", fontSize: "18px" }}>
                    +{listing.service_tags.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 48px",
              backgroundColor: "#4ECDC4",
            }}
          >
            <span style={{ fontSize: "16px", color: "#1E293B", fontWeight: 600 }}>
              groomlocal.com/groomer/{listing.slug}
            </span>
            <span style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
              Find your pawfect groomer
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    console.error("OG groomer error:", error);
    return new Response(`Error generating image: ${error}`, { status: 500 });
  }
}
