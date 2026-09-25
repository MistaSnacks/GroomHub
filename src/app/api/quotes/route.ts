import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

const VALID_PET_TYPES = ["dog", "cat"];
const VALID_SIZES = ["small", "medium", "large", "xlarge", ""];

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

async function persist(q: QuotePayload): Promise<{ ok: true; id: string } | { ok: false; detail: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("quote_requests")
    .insert({
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
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, detail: error ? `${error.code ?? "unknown"}: ${error.message}` : "no row returned" };
  }
  return { ok: true, id: data.id as string };
}

// Owner notification. The quote row is the source of truth; the email outcome is
// recorded on the row so an unnotified quote can be found later.
async function notify(q: QuotePayload, quoteId: string): Promise<void> {
  const to = process.env.QUOTE_NOTIFY_EMAIL;
  const admin = createAdminClient();
  if (!to) {
    console.error(JSON.stringify({ scope: "email", site: "quote", ok: false, error: "missing QUOTE_NOTIFY_EMAIL", quoteId }));
    await admin.from("quote_requests").update({ notify_error: "missing QUOTE_NOTIFY_EMAIL" }).eq("id", quoteId);
    return;
  }
  const result = await sendEmail({
    site: "quote",
    to,
    subject: `New quote request: ${q.petType} in ${q.city}`,
    text: summarize(q),
    replyTo: q.email,
    context: { quoteId },
  });
  await admin
    .from("quote_requests")
    .update(
      result.ok
        ? { notified_at: new Date().toISOString(), resend_id: result.id, notify_error: null }
        : { notify_error: result.error.slice(0, 500) }
    )
    .eq("id", quoteId);
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
    console.error(JSON.stringify({ scope: "quote", event: "persist_failed", detail: saved.detail }));
    return NextResponse.json(
      { error: "Something went wrong saving your request. Please try again." },
      { status: 500 }
    );
  }

  await notify(data, saved.id);
  return NextResponse.json({ success: true });
}
