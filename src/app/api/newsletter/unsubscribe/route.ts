import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><meta name="robots" content="noindex"></head><body style="font-family:system-ui,sans-serif;background:#FDF8F0;color:#1E293B;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0"><main style="max-width:480px;padding:24px;text-align:center"><h1>${title}</h1><p style="color:#475569">${body}</p><p><a href="https://groomlocal.com/">Back to GroomLocal</a></p></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return page("That link is not valid", "The unsubscribe link is missing or has expired. Reply to any GroomLocal email and we will remove you by hand.", 400);
  }
  const { error } = await createAdminClient()
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("email", email);
  if (error) {
    console.error(JSON.stringify({ scope: "newsletter", event: "unsubscribe_failed", code: error.code, message: error.message }));
    return page("Something went wrong", "We could not update your subscription just now. Please try again in a minute.", 500);
  }
  return page("You are unsubscribed", "You will not receive further newsletter emails from GroomLocal.");
}
