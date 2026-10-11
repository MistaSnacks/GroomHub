"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { headers } from "next/headers";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { createListingFromSubmission } from "@/lib/listing-create";
import { isDisposableEmail } from "@/lib/claims";
import { revalidatePath, updateTag } from "next/cache";

interface SubmitResult {
  ok: boolean;
  error?: string;
  /** The live listing the submitter should claim next. Missing if creation failed and the row waits for an admin. */
  slug?: string;
  /** False when the business was already listed and we pointed them at the existing page. */
  created?: boolean;
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

async function notify(r: SubmissionRow, submissionId: string, listing: { slug?: string; created?: boolean }): Promise<void> {
  const to = process.env.LISTING_NOTIFY_EMAIL;
  if (!to) {
    console.error(JSON.stringify({ scope: "email", site: "listing_submission", ok: false, error: "missing LISTING_NOTIFY_EMAIL", submissionId }));
    return;
  }
  await sendEmail({
    site: "listing_submission",
    to,
    subject: listing.slug
      ? `${listing.created ? "New listing live" : "Existing listing matched"}: ${r.business_name}`
      : `Listing submission needs manual setup: ${r.business_name}`,
    replyTo: r.email,
    text: [
      listing.slug
        ? `${listing.created ? "Created and live" : "Already listed"}: https://groomlocal.com/groomer/${listing.slug}\nThe submitter was sent to claim it. If it is spam, delete the row in business_listings.\n`
        : "Automatic listing creation failed. Create it by hand from the admin inbox.\n",
      `Business: ${r.business_name}`,
      `Contact: ${r.contact_name || "N/A"}`,
      `Location: ${r.city}, ${r.state}`,
      `Email: ${r.email}`,
      `Phone: ${r.phone || "N/A"}`,
      `Website: ${r.website || "N/A"}`,
      `Notes: ${r.notes || "N/A"}`,
    ].join("\n"),
    context: { submissionId },
  });
}

export async function submitListing(formData: FormData): Promise<SubmitResult> {
  const honeypot = formData.get("hp_field");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    // A filled honeypot is usually a bot, but browser autofill can hit it too.
    // Log it so a real owner's lost submission is at least visible in Vercel logs.
    const droppedEmail = String(formData.get("email") || "");
    console.warn(JSON.stringify({
      scope: "listing_submission",
      event: "honeypot_drop",
      business: String(formData.get("business_name") || "").slice(0, 80),
      emailDomain: droppedEmail.includes("@") ? droppedEmail.split("@").pop() : null,
    }));
    return { ok: true };
  }

  if (!rateLimit(`submit:${clientKey(await headers())}`, 5, 10 * 60_000).ok) {
    return { ok: false, error: "Too many submissions from this connection. Please try again in a few minutes." };
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

  if (isDisposableEmail(email)) {
    return { ok: false, error: "Please use your business or personal email, not a temporary inbox." };
  }

  const supabase = createAdminClient();

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

  const { data, error } = await supabase.from("listing_submissions").insert(row).select("id").single();

  if (error || !data) {
    console.error(JSON.stringify({ scope: "listing_submission", event: "insert_failed", code: error?.code, message: error?.message }));
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const submissionId = data.id as string;
  const created = await createListingFromSubmission(supabase, row);
  if (!created.ok) {
    console.error(JSON.stringify({ scope: "listing_submission", event: "listing_create_failed", submissionId, error: created.error }));
    await notify(row, submissionId, {});
    return { ok: true };
  }

  await supabase.from("listing_submissions").update({ status: "handled" }).eq("id", submissionId);
  if (created.created) {
    updateTag("listings");
    revalidatePath(`/groomer/${created.slug}`);
  }
  await notify(row, submissionId, created);

  return { ok: true, slug: created.slug, created: created.created };
}
