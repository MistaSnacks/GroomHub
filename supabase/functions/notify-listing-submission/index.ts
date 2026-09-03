import "@supabase/functions-js/edge-runtime.d.ts";

interface ListingPayload {
  type: "INSERT";
  table: "listing_submissions";
  record: {
    business_name: string;
    contact_name: string | null;
    city: string;
    state: string;
    email: string;
    phone: string | null;
    website: string | null;
    notes: string | null;
  };
}

Deno.serve(async (req) => {
  // Verify this is a POST from a database webhook
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload: ListingPayload = await req.json();
  const r = payload.record;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("RESEND_API_KEY not set");
    return new Response("Missing API key", { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GroomLocal <noreply@groomlocal.com>",
      to: "info@groomlocal.com",
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
    const err = await res.text();
    console.error("Resend error:", err);
    return new Response(err, { status: res.status });
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
