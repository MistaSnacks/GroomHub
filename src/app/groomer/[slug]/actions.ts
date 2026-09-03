"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  renderBrandedEmail,
  emailDetailCard,
  emailParagraph,
  escapeHtml,
} from "@/lib/email/template";

export type GroomerMessageResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function notifyOwner(opts: {
  to: string;
  listingName: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  message: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("Groomer message notify skipped: RESEND_API_KEY not set");
    return;
  }
  try {
    const html = renderBrandedEmail({
      preheader: `New message about ${opts.listingName}`,
      heading: "A pet parent sent you a message",
      body:
        emailParagraph(
          `Someone contacted <strong>${escapeHtml(opts.listingName)}</strong> through GroomLocal.`
        ) +
        emailDetailCard("Message details", [
          { label: "From", value: opts.senderName },
          { label: "Email", value: opts.senderEmail },
          { label: "Phone", value: opts.senderPhone || "Not provided" },
          { label: "Message", value: opts.message },
        ]),
      cta: {
        label: "Open your inbox",
        url: "https://groomlocal.com/dashboard/inbox",
      },
      footerNote: `This message was sent via the contact form on your GroomLocal listing.`,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL || "GroomLocal <onboarding@resend.dev>",
        to: [opts.to],
        subject: `New GroomLocal message for ${opts.listingName}`,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Groomer message notify failed:", res.status);
    }
  } catch {
    console.error("Groomer message notify failed");
  }
}

export async function sendGroomerMessage(
  formData: FormData
): Promise<GroomerMessageResult> {
  if (formData.get("hp_field")?.toString()) {
    return { ok: true };
  }

  const listingId = formData.get("listingId")?.toString().trim() || "";
  const listingSlug = formData.get("listingSlug")?.toString().trim() || "";
  const name = formData.get("name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";
  const petDetails = formData.get("pet_details")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";

  if (!listingId || !listingSlug) {
    return { ok: false, error: "Missing listing information." };
  }
  if (!name || name.length > 120) {
    return { ok: false, error: "Please enter your name (120 characters or fewer)." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (phone.length > 40) {
    return { ok: false, error: "Phone number must be 40 characters or fewer." };
  }
  if (message.length < 10 || message.length > 2000) {
    return { ok: false, error: "Message must be between 10 and 2000 characters." };
  }

  const storedMessage = petDetails
    ? `${message}\n\nPet details: ${petDetails}`
    : message;

  const admin = getAdmin();
  const { data: listing, error: listingError } = await admin
    .from("business_listings")
    .select("id, name, slug, email, owner_id")
    .eq("id", listingId)
    .eq("slug", listingSlug)
    .single();

  if (listingError || !listing || !listing.owner_id) {
    return { ok: false, error: "This listing is not accepting messages." };
  }

  const { error: insertError } = await admin.from("leads").insert({
    listing_id: listing.id,
    sender_name: name,
    sender_email: email,
    sender_phone: phone || null,
    message: storedMessage,
    status: "new",
  });

  if (insertError) {
    console.error("Lead insert failed:", insertError.code);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  let ownerEmail = listing.email as string | null;
  if (!ownerEmail) {
    const { data: ownerData, error: ownerError } = await admin.auth.admin.getUserById(
      listing.owner_id
    );
    if (ownerError) {
      console.error("Owner email lookup failed");
    } else {
      ownerEmail = ownerData.user?.email ?? null;
    }
  }

  if (ownerEmail) {
    await notifyOwner({
      to: ownerEmail,
      listingName: listing.name,
      senderName: name,
      senderEmail: email,
      senderPhone: phone || null,
      message: storedMessage,
    });
  }

  return { ok: true };
}
