import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOptOutToken } from "@/lib/owner-reminders";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><meta name="robots" content="noindex"></head><body style="font-family:system-ui,sans-serif;background:#FDF8F0;color:#1E293B;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0"><main style="max-width:480px;padding:24px;text-align:center"><h1>${title}</h1><p style="color:#475569">${body}</p><p><a href="https://groomlocal.com/dashboard">Go to your dashboard</a></p></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

async function optOut(request: NextRequest) {
  const userId = (request.nextUrl.searchParams.get("u") ?? "").trim().toLowerCase();
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!UUID_RE.test(userId) || !token || !verifyOptOutToken(userId, token)) {
    return page("That link is not valid", "The link is missing or has expired. Reply to any GroomLocal email and we will turn these emails off by hand.", 400);
  }
  const { error } = await createAdminClient()
    .from("owner_email_optouts")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) {
    console.error(JSON.stringify({ scope: "owner_reminders", event: "optout_failed", code: error.code, message: error.message }));
    return page("Something went wrong", "We could not update your settings just now. Please try again in a minute.", 500);
  }
  return page("Emails turned off", "We will not send you profile reminders or monthly reports. You will still get emails about claims and messages from dog owners.");
}

// GET is the link in the email body; POST is the one-click request mail apps send for List-Unsubscribe-Post.
export const GET = optOut;
export const POST = optOut;
