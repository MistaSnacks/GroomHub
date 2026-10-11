"use server";

import { revalidatePath } from "next/cache";
import { invalidateCore } from "@/lib/admin-console/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin";
import { logEvent } from "@/lib/log";

/**
 * Inbox triage flags. These only mark rows as dealt with for the admin's own
 * bookkeeping; nothing is emailed. Groomer messages (leads) are left alone because
 * their status drives the owner's inbox.
 */

const SUBMISSION_STATUSES = ["new", "handled", "dismissed"] as const;
const QUOTE_STATUSES = ["new", "handled"] as const;

type Result = { ok: true } | { ok: false; error: string };

export async function setSubmissionStatus(id: string, status: string): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized" };
  if (!(SUBMISSION_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Unknown status." };
  const { error } = await createAdminClient().from("listing_submissions").update({ status }).eq("id", id);
  if (error) {
    logEvent("error", "admin_inbox", "submission_status_failed", { id, code: error.code, message: error.message });
    return { ok: false, error: error.message };
  }
  invalidateCore();
  revalidatePath("/admin/dashboard/leads");
  return { ok: true };
}

export async function setQuoteStatus(id: string, status: string): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized" };
  if (!(QUOTE_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Unknown status." };
  const { error } = await createAdminClient().from("quote_requests").update({ status }).eq("id", id);
  if (error) {
    logEvent("error", "admin_inbox", "quote_status_failed", { id, code: error.code, message: error.message });
    return { ok: false, error: error.message };
  }
  invalidateCore();
  revalidatePath("/admin/dashboard/leads");
  return { ok: true };
}
