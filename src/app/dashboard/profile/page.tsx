import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Storefront, FloppyDisk } from "@phosphor-icons/react/dist/ssr";
import { revalidatePath } from "next/cache";

export default async function ProfileEditorPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Default to the first listing they own if no ID is provided
    let query = supabase.from("business_listings").select("*").eq("owner_id", user.id);
    if (params.id) {
        query = query.eq("id", params.id);
    }

    const { data: listings } = await query;
    const listing = listings?.[0];

    if (!listing) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-2xl border border-border p-12 text-center">
                    <h2 className="text-xl font-bold text-brand-primary mb-2">No listing found</h2>
                    <p className="text-text-muted">You do not have access to edit this listing, or it does not exist.</p>
                </div>
            </div>
        );
    }

    async function updateProfile(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const short_description = formData.get("short_description") as string;
        const description = formData.get("description") as string;
        const phone = formData.get("phone") as string;
        const website = formData.get("website") as string;

        const sb = await createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        await sb.from("business_listings")
            .update({
                name,
                short_description,
                description,
                phone,
                website
            })
            .eq("id", id)
            .eq("owner_id", user.id);

        revalidatePath("/dashboard/profile");
        revalidatePath("/dashboard");
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6">
            <div className="mb-2">
                <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
                    Public Profile
                </h1>
                <p className="text-text-muted">
                    Update the details displayed on your public directory listing.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden md:max-w-3xl">
                <div className="p-6 border-b border-border bg-gray-50/50 flex items-center gap-3">
                    <Storefront className="w-5 h-5 text-brand-secondary" weight="duotone" />
                    <h2 className="font-heading text-lg font-bold text-brand-primary">
                        Business Details
                    </h2>
                </div>

                <form action={updateProfile} className="p-6 space-y-6">
                    <input type="hidden" name="id" value={listing.id} />

                    <div>
                        <label className="block text-sm font-bold text-text mb-1.5">Business Name</label>
                        <input
                            name="name"
                            defaultValue={listing.name}
                            required
                            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-text mb-1.5">Phone Number</label>
                            <input
                                name="phone"
                                defaultValue={listing.phone || ""}
                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text mb-1.5">Website URL</label>
                            <input
                                name="website"
                                type="url"
                                defaultValue={listing.website || ""}
                                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text mb-1.5">Short Description</label>
                        <textarea
                            name="short_description"
                            defaultValue={listing.short_description || ""}
                            rows={2}
                            maxLength={150}
                            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                            placeholder="A brief tagline (max 150 chars)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text mb-1.5">Full Description</label>
                        <textarea
                            name="description"
                            defaultValue={listing.description || ""}
                            rows={6}
                            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                            placeholder="Tell pet parents about your business, experience, and what makes you special."
                        />
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 shadow-sm"
                        >
                            <FloppyDisk weight="bold" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
