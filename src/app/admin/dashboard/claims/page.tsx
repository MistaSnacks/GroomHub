import Link from "next/link";
import { listClaimRequests } from "./actions";
import { ClaimsClient, type ClaimContext } from "./claims-client";
import { loadOutreach } from "@/lib/admin-console/outreach";
import { contactIndex } from "@/lib/admin-console/insights";
import { PageBody, PageHeader } from "../../_components/ui";

export const metadata = { title: "Claims" };

function host(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export default async function ClaimRequestsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const status = view === "all" ? "all" : "pending";
  const [requests, outreach] = await Promise.all([listClaimRequests(status), loadOutreach()]);
  const contacts = contactIndex(outreach.data);

  const context: Record<string, ClaimContext> = {};
  for (const r of requests) {
    const emailDomain = r.user_email.split("@")[1]?.toLowerCase() ?? null;
    const site = host(r.listing_website);
    const contact = contacts.get(r.listing_slug);
    context[r.id] = {
      emailDomain,
      websiteHost: site,
      domainMatch: !!emailDomain && !!site && (site === emailDomain || site.endsWith(`.${emailDomain}`)),
      outreachSent: contact?.sent ?? null,
      outreachEmail: contact?.email ?? null,
    };
  }

  return (
    <>
      <PageHeader
        eyebrow="Run the business"
        title="Claims"
        description="Claims approve themselves unless the email looks clearly unrelated to the business (a throwaway address, or another company's domain). Those wait here. Approving sets the owner and sends the welcome email."
        actions={
          <div className="flex rounded-lg border border-adm-line bg-white p-0.5 text-sm">
            <Link href="/admin/dashboard/claims" className={`rounded-md px-3 py-1 font-medium ${status === "pending" ? "bg-brand-primary text-white" : "text-stone-600"}`}>
              Waiting
            </Link>
            <Link href="/admin/dashboard/claims?view=all" className={`rounded-md px-3 py-1 font-medium ${status === "all" ? "bg-brand-primary text-white" : "text-stone-600"}`}>
              All claims
            </Link>
          </div>
        }
      />
      <PageBody>
        <ClaimsClient requests={requests} view={status} context={context} />
      </PageBody>
    </>
  );
}
