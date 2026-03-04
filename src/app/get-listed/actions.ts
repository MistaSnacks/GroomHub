"use server";

import { createClient } from "@/lib/supabase/server";

interface SubmitResult {
  ok: boolean;
  error?: string;
}

export async function submitListing(formData: FormData): Promise<SubmitResult> {
  const business_name = formData.get("business_name")?.toString().trim();
  const contact_name = formData.get("contact_name")?.toString().trim() || null;
  const city = formData.get("city")?.toString().trim();
  const state = formData.get("state")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const website = formData.get("website")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;

  // Validate required fields
  if (!business_name || !city || !state || !email) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  if (!["WA", "OR"].includes(state)) {
    return { ok: false, error: "Please select a valid state." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("listing_submissions").insert({
    business_name,
    contact_name,
    city,
    state,
    email,
    phone,
    website,
    notes,
  });

  if (error) {
    console.error("Listing submission error:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Fire-and-forget email notification (silently skip if no API key)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GroomLocal <noreply@groomlocal.com>",
        to: "hello@groomlocal.com",
        subject: `New listing submission: ${business_name}`,
        text: `Business: ${business_name}\nContact: ${contact_name || "N/A"}\nCity: ${city}, ${state}\nEmail: ${email}\nPhone: ${phone || "N/A"}\nWebsite: ${website || "N/A"}\nNotes: ${notes || "N/A"}`,
      }),
    }).catch(() => {
      // Silently ignore email failures
    });
  }

  return { ok: true };
}
