import { getClaimedListings } from "./actions";
import { ClaimedListingsClient } from "./claimed-listings-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Claimed Listings - Admin",
};

export default async function ClaimedListingsPage() {
  const listings = await getClaimedListings();
  return <ClaimedListingsClient listings={listings} />;
}
