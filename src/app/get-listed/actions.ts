"use server";

import { createClient } from "@/lib/supabase/server";

interface SubmitResult {
  ok: boolean;
  error?: string;
}

interface SubmissionRow {
  business_name: string;
  contact_name: string | null;
  city: string;
  state: string;
  email: string;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

const MAX_PAYLOAD_BYTES = 20_000;

function clean(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function notify(r: SubmissionRow): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LISTING_NOTIFY_EMAIL;
  if (!key || !to) {
    console.warn("Listing notify skipped: RESEND_API_KEY or LISTING_NOTIFY_EMAIL not set");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL || "GroomLocal <onboarding@resend.dev>",
        to: [to],
        subject: `New listing submission: ${r.business_name}`,
        text: [
          `Business: ${r.business_name}`,
          `Contact: ${r.contact_name || "N/A"}`,
          `Location: ${r.city}, ${r.state}`,
          `Email: ${r.email}`,
          `Phone: ${r.phone || "N/A"}`,
          `Website: ${r.website || "N/A"}`,
          `Notes: ${r.notes || "N/A"}`,
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.error("Listing notify failed:", res.status);
    }
  } catch {
    console.error("Listing notify failed");
  }
}

export async function submitListing(formData: FormData): Promise<SubmitResult> {
  const honeypot = formData.get("hp_field");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return { ok: true };
  }

  let payloadSize = 0;
  formData.forEach((value) => {
    if (typeof value === "string") payloadSize += value.length;
  });
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const business_name = clean(formData.get("business_name"), 200);
  const contact_name = clean(formData.get("contact_name"), 100) || null;
  const city = clean(formData.get("city"), 100);
  const state = clean(formData.get("state"), 2);
  const email = clean(formData.get("email"), 200).toLowerCase();
  const phone = clean(formData.get("phone"), 30) || null;
  const website = clean(formData.get("website"), 500) || null;
  const notes = clean(formData.get("notes"), 2000) || null;

  if (!business_name || !city || !state || !email) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  if (!["WA", "OR"].includes(state)) {
    return { ok: false, error: "Please select a valid state." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();

  const row: SubmissionRow = {
    business_name,
    contact_name,
    city,
    state,
    email,
    phone,
    website,
    notes,
  };

  const { error } = await supabase.from("listing_submissions").insert(row);

  if (error) {
    console.error("Listing submission error:", error.code);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  await notify(row);

  return { ok: true };
}
