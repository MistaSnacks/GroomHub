import { listClaimRequests } from "./actions";
import { ClaimsClient } from "./claims-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Claim Requests - Admin",
};

export default async function ClaimRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const status = view === "all" ? "all" : "pending";
  const requests = await listClaimRequests(status);
  return <ClaimsClient requests={requests} view={status} />;
}
