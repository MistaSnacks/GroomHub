import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_PAYLOAD_BYTES = 20_000;

function clean(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const raw = await request.text();
    if (raw.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const body = JSON.parse(raw) as { email?: unknown; hp_field?: unknown };

    if (typeof body.hp_field === "string" && body.hp_field.length > 0) {
      return NextResponse.json({ success: true });
    }

    const email = clean(body.email, 200).toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Re-subscribing an existing address is a success, not a conflict.
    const { error } = await createAdminClient()
      .from("newsletter_subscribers")
      .upsert({ email, source: "website", unsubscribed_at: null }, { onConflict: "email" });

    if (error) {
      console.error(JSON.stringify({ scope: "newsletter", event: "upsert_failed", code: error.code, message: error.message }));
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
