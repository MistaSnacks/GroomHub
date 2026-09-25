import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leads and Quotes - Admin",
};

interface QuoteRow {
  id: string; created_at: string; pet_type: string; pet_breed: string | null; services: string[]; city: string;
  name: string; email: string; phone: string | null; notes: string | null; status: string;
  notified_at: string | null; notify_error: string | null;
}
interface LeadRow {
  id: string; created_at: string | null; sender_name: string; sender_email: string; sender_phone: string | null;
  message: string; status: string; notified_at: string | null; notify_error: string | null;
  business_listings: { name?: string; slug?: string } | { name?: string; slug?: string }[] | null;
}

function when(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Notified({ at, error }: { at: string | null; error: string | null }) {
  if (at) return <span className="text-green-700">emailed {when(at)}</span>;
  return <span className="text-red-700">not emailed{error ? `: ${error}` : ""}</span>;
}

export default async function LeadsPage() {
  if (!(await requireAdmin())) redirect("/login?redirect=/admin/dashboard/leads");
  const db = createAdminClient();

  const [quotesRes, leadsRes] = await Promise.all([
    db.from("quote_requests").select("id, created_at, pet_type, pet_breed, services, city, name, email, phone, notes, status, notified_at, notify_error").order("created_at", { ascending: false }).limit(200),
    db.from("leads").select("id, created_at, sender_name, sender_email, sender_phone, message, status, notified_at, notify_error, business_listings(name, slug)").order("created_at", { ascending: false }).limit(200),
  ]);
  if (quotesRes.error) throw new Error(`quote_requests: ${quotesRes.error.message}`);
  if (leadsRes.error) throw new Error(`leads: ${leadsRes.error.message}`);
  const quotes = (quotesRes.data ?? []) as QuoteRow[];
  const leads = (leadsRes.data ?? []) as LeadRow[];
  const unnotified = quotes.filter((q) => !q.notified_at).length + leads.filter((l) => !l.notified_at).length;

  return (
    <div className="p-6 max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads and Quotes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every quote request and groomer message, newest first. {unnotified > 0 ? `${unnotified} did not get a notification email.` : "All rows were emailed."}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quote requests ({quotes.length})</h2>
        {quotes.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 p-6">No quote requests yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">When</th><th className="px-4 py-3 font-medium">Who</th><th className="px-4 py-3 font-medium">Pet</th><th className="px-4 py-3 font-medium">Services</th><th className="px-4 py-3 font-medium">City</th><th className="px-4 py-3 font-medium">Notification</th>
              </tr></thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-gray-100 align-top">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{when(q.created_at)}</td>
                    <td className="px-4 py-3"><div className="font-medium text-gray-900">{q.name}</div><a href={`mailto:${q.email}`} className="text-blue-600 hover:underline">{q.email}</a>{q.phone && <div className="text-gray-500">{q.phone}</div>}</td>
                    <td className="px-4 py-3 text-gray-700">{q.pet_type}{q.pet_breed ? `, ${q.pet_breed}` : ""}</td>
                    <td className="px-4 py-3 text-gray-700">{q.services.join(", ")}{q.notes && <div className="text-gray-500 mt-1 max-w-xs">{q.notes}</div>}</td>
                    <td className="px-4 py-3 text-gray-700">{q.city}</td>
                    <td className="px-4 py-3"><Notified at={q.notified_at} error={q.notify_error} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Groomer messages ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 p-6">No messages to claimed listings yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">When</th><th className="px-4 py-3 font-medium">Listing</th><th className="px-4 py-3 font-medium">From</th><th className="px-4 py-3 font-medium">Message</th><th className="px-4 py-3 font-medium">Notification</th>
              </tr></thead>
              <tbody>
                {leads.map((l) => {
                  const rel = Array.isArray(l.business_listings) ? l.business_listings[0] : l.business_listings;
                  return (
                    <tr key={l.id} className="border-b border-gray-100 align-top">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{when(l.created_at)}</td>
                      <td className="px-4 py-3">{rel?.slug ? <a href={`/groomer/${rel.slug}`} className="text-blue-600 hover:underline">{rel.name ?? rel.slug}</a> : "-"}</td>
                      <td className="px-4 py-3"><div className="font-medium text-gray-900">{l.sender_name}</div><a href={`mailto:${l.sender_email}`} className="text-blue-600 hover:underline">{l.sender_email}</a>{l.sender_phone && <div className="text-gray-500">{l.sender_phone}</div>}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-md whitespace-pre-wrap">{l.message}</td>
                      <td className="px-4 py-3"><Notified at={l.notified_at} error={l.notify_error} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
