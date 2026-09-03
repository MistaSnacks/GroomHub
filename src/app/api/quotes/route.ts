import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_PET_TYPES = ["dog", "cat"];
const VALID_SIZES = ["small", "medium", "large", "xlarge", ""];

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface QuotePayload {
  petType: string;
  petName: string;
  petBreed: string;
  petSize: string;
  services: string[];
  city: string;
  preferredDate: string;
  preferredTime: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

function clean(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validate(body: Partial<QuotePayload>): { data?: QuotePayload; error?: string } {
  const petType = clean(body.petType, 10);
  const city = clean(body.city, 100);
  const name = clean(body.name, 100);
  const email = clean(body.email, 200).toLowerCase();
  const services = Array.isArray(body.services)
    ? body.services.map((s) => clean(s, 100)).filter(Boolean).slice(0, 20)
    : [];

  if (!VALID_PET_TYPES.includes(petType)) return { error: "Please select a pet type." };
  if (services.length === 0) return { error: "Please select at least one service." };
  if (!city) return { error: "Please enter your city or ZIP code." };
  if (!name) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };

  const petSize = clean(body.petSize, 10);
  return {
    data: {
      petType,
      petName: clean(body.petName, 100),
      petBreed: clean(body.petBreed, 100),
      petSize: VALID_SIZES.includes(petSize) ? petSize : "",
      services,
      city,
      preferredDate: clean(body.preferredDate, 20),
      preferredTime: clean(body.preferredTime, 20),
      name,
      email,
      phone: clean(body.phone, 30),
      notes: clean(body.notes, 2000),
    },
  };
}

function summarize(q: QuotePayload): string {
  return [
    `Quote request from ${q.name} (${q.email}${q.phone ? `, ${q.phone}` : ""})`,
    `Pet: ${q.petType}${q.petName ? ` named ${q.petName}` : ""}${q.petBreed ? `, ${q.petBreed}` : ""}${q.petSize ? `, ${q.petSize}` : ""}`,
    `Services: ${q.services.join(", ")}`,
    `Location: ${q.city}`,
    q.preferredDate || q.preferredTime
      ? `Preferred: ${[q.preferredDate, q.preferredTime].filter(Boolean).join(" / ")}`
      : "",
    q.notes ? `Notes: ${q.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function persist(q: QuotePayload): Promise<{ ok: boolean; detail?: string }> {
  const admin = getAdmin();

  const { error } = await admin.from("quote_requests").insert({
    pet_type: q.petType,
    pet_name: q.petName || null,
    pet_breed: q.petBreed || null,
    pet_size: q.petSize || null,
    services: q.services,
    city: q.city,
    preferred_date: q.preferredDate || null,
    preferred_time: q.preferredTime || null,
    name: q.name,
    email: q.email,
    phone: q.phone || null,
    notes: q.notes || null,
  });

  if (!error) return { ok: true };

  // Table may not exist yet (migration pending) — capture the request as an
  // analytics event instead so nothing is lost.
  const { error: fallbackErr } = await admin.from("analytics_events").insert({
    event_type: "quote_request",
    url: "/get-quotes",
    metadata: { ...q, summary: summarize(q) },
  });

  if (!fallbackErr) return { ok: true };
  return { ok: false, detail: `${error.message}; fallback: ${fallbackErr.message}` };
}

// Best-effort owner notification. No-ops when RESEND_API_KEY is missing or
// invalid; the Supabase row is the source of truth either way.
async function notify(q: QuotePayload): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL || "GroomLocal <onboarding@resend.dev>",
        to: [to],
        subject: `New quote request: ${q.petType} in ${q.city}`,
        text: summarize(q),
      }),
    });
  } catch (err) {
    console.error("Quote notify failed:", err);
  }
}

const MAX_PAYLOAD_BYTES = 20_000;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let body: Partial<QuotePayload> & { hp_field?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.hp_field === "string" && body.hp_field.length > 0) {
    return NextResponse.json({ success: true });
  }

  const { data, error } = validate(body);
  if (!data) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const saved = await persist(data);
  if (!saved.ok) {
    console.error("Quote persist failed:", saved.detail);
    return NextResponse.json(
      { error: "Something went wrong saving your request. Please try again." },
      { status: 500 }
    );
  }

  await notify(data);
  return NextResponse.json({ success: true });
}
