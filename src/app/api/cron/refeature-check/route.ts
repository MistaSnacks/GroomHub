import { NextRequest, NextResponse } from "next/server";
import { getRefeatureTriggerStatus, type RefeatureTriggerStatus } from "@/lib/refeature-trigger";
import { sendEmail } from "@/lib/email/send";

export const maxDuration = 30;

export const dynamic = "force-dynamic";

// Daily Vercel cron (see vercel.json). Emails the admin once the re-feature
// trigger is met. Stops emailing automatically once the house listing is
// sponsored again, because the status then reports met = false.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getRefeatureTriggerStatus();
  const emailed = status.met ? await notify(status) : false;
  if (status.met && !emailed) {
    // The trigger fired but nobody was told. Non-200 so Vercel's cron log shows it.
    return NextResponse.json({ ...status, emailed }, { status: 500 });
  }
  return NextResponse.json({ ...status, emailed });
}

async function notify(s: RefeatureTriggerStatus): Promise<boolean> {
  const to = process.env.LISTING_NOTIFY_EMAIL;
  if (!to) {
    console.error(JSON.stringify({ scope: "email", site: "refeature_cron", ok: false, error: "missing LISTING_NOTIFY_EMAIL" }));
    return false;
  }
  const result = await sendEmail({
    site: "refeature_cron",
    to,
    subject: "GroomLocal: re-feature trigger met",
    text: [
      "The conditions for moving the house listing back to a Sponsored seat are met.",
      "",
      `Other claimed listings: ${s.otherClaimed} (target ${s.claimedTarget})`,
      `Paying sponsors elsewhere: ${s.payingSponsors} (target ${s.sponsorsTarget})`,
      `House listing city: ${s.houseCity ?? "unknown"}`,
      "",
      "Before acting, apply the rules:",
      "1. Same terms as any sponsor: same price, payment recorded, same Sponsored label.",
      "2. Confirm no paying sponsor is waitlisted in that city.",
      "3. Set subscription_tier = premium, is_featured = true, sponsor_paid_until = paid-through date.",
      "",
      "This email repeats daily until the house listing is sponsored again.",
    ].join("\n"),
  });
  return result.ok;
}
