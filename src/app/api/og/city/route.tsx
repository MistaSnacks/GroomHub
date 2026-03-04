import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getCityBySlug } from "@/lib/supabase/queries";
import { stateNameFromSlug, stateAbbrFromSlug } from "@/lib/geography";

export const runtime = "nodejs";

const serviceConfig: Record<string, { heading: string; emoji: string; path: string }> = {
  dog: { heading: "Dog Grooming in", emoji: "🐕", path: "dog-grooming" },
  cat: { heading: "Cat Groomers in", emoji: "🐈", path: "cat-grooming" },
  mobile: { heading: "Mobile Groomers in", emoji: "🚐", path: "mobile-grooming" },
};

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const state = req.nextUrl.searchParams.get("state");
  if (!city || !state) {
    return new Response("Missing city or state parameter", { status: 400 });
  }

  const service = req.nextUrl.searchParams.get("service") ?? "dog";
  const config = serviceConfig[service] ?? serviceConfig.dog;

  let cityName = city.charAt(0).toUpperCase() + city.slice(1);
  let count = 0;

  try {
    const cityData = await getCityBySlug(city, stateAbbrFromSlug(state));
    if (cityData) {
      cityName = cityData.name;
      count = cityData.groomer_count;
    }
  } catch (e) {
    console.error("OG city DB error:", e);
  }

  const stateAbbr = stateAbbrFromSlug(state);
  const stateName = stateNameFromSlug(state);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
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
            <span
              style={{ fontSize: "24px", color: "#FFFFFF", fontWeight: 600 }}
            >
              GroomLocal
            </span>
          </div>
          <span style={{ fontSize: "14px", color: "#94A3B8" }}>
            PET GROOMING DIRECTORY
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px",
            flexGrow: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "48px" }}>{config.emoji}</span>
            <span style={{ fontSize: "52px", color: "#1E293B", fontWeight: 700 }}>
              {config.heading}
            </span>
          </div>
          <div style={{ fontSize: "56px", color: "#4ECDC4", fontWeight: 700, marginTop: "4px" }}>
            {`${cityName}, ${stateAbbr}`}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(78, 205, 196, 0.15)",
                borderRadius: "999px",
                padding: "10px 24px",
                border: "1px solid rgba(78, 205, 196, 0.3)",
                fontSize: "22px",
                color: "#0D9488",
                fontWeight: 600,
              }}
            >
              {`${count} Verified Groomers`}
            </div>
            <span style={{ fontSize: "18px", color: "#94A3B8", marginLeft: "16px" }}>
              {stateName}
            </span>
          </div>
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
            {`groomlocal.com/${config.path}/${state}/${city}`}
          </span>
          <span style={{ fontSize: "16px", color: "#1E293B", fontWeight: 500 }}>
            Find your pawfect groomer
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
