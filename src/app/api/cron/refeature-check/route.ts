import { NextRequest, NextResponse } from "next/server";
import { getRefeatureTriggerStatus, type RefeatureTriggerStatus } from "@/lib/refeature-trigger";

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
  return NextResponse.json({ ...status, emailed });
}

async function notify(s: RefeatureTriggerStatus): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LISTING_NOTIFY_EMAIL;
  if (!key || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL || "GroomLocal <onboarding@resend.dev>",
        to: [to],
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
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
