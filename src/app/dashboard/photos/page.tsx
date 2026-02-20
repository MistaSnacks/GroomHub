import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Image as ImageIcon, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { revalidatePath } from "next/cache";

export default async function PhotosPage({
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

    // Mock functions for form actions (these would actually hit Supabase Storage in production)
    async function uploadMockPhoto(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        const uploadType = formData.get("upload") as string;

        const sb = await createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        // Fetch current images
        const { data: currentListing } = await sb.from("business_listings").select("images").eq("id", id).single();
        const currentImages = currentListing?.images || [];

        let newImage = "";
        if (uploadType === "1") newImage = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800";
        if (uploadType === "2") newImage = "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=800";
        if (uploadType === "3") newImage = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800";

        if (newImage && !currentImages.includes(newImage)) {
            await sb.from("business_listings").update({ images: [...currentImages, newImage] }).eq("id", id).eq("owner_id", user.id);
        }

        revalidatePath("/dashboard/photos");
    }

    async function deleteMockPhoto(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        const imageUrlToRemove = formData.get("imageUrl") as string;

        const sb = await createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data: currentListing } = await sb.from("business_listings").select("images").eq("id", id).single();
        const currentImages = currentListing?.images || [];

        const newImages = currentImages.filter((img: string) => img !== imageUrlToRemove);

        await sb.from("business_listings").update({ images: newImages }).eq("id", id).eq("owner_id", user.id);
        revalidatePath("/dashboard/photos");
    }

    const tierLimit = listing.subscription_tier === "free" ? 1 : listing.subscription_tier === "standard" ? 10 : 50;
    const currentImages = listing.images || [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6">
            <div className="mb-2">
                <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
                    Photos
                </h1>
                <p className="text-text-muted">
                    Manage the gallery images displayed on your listing.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-gray-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-brand-secondary" weight="duotone" />
                        <h2 className="font-heading text-lg font-bold text-brand-primary">
                            Gallery Images
                        </h2>
                    </div>
                    <div className="text-sm font-medium text-text-muted bg-white px-3 py-1 rounded-full border border-border shadow-sm">
                        {currentImages.length} / {tierLimit} used
                    </div>
                </div>

                <div className="p-6">
                    {/* Upgrade Warning if full */}
                    {currentImages.length >= tierLimit && listing.subscription_tier === "free" && (
                        <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                            <strong className="font-bold">You've reached your free tier limit (1 photo).</strong>
                            <br />Upgrade to Standard to add up to 10 photos, or Premium for unlimited photos!
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Render existing images */}
                        {currentImages.map((img: string, i: number) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border relative group">
                                <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <form action={deleteMockPhoto}>
                                        <input type="hidden" name="id" value={listing.id} />
                                        <input type="hidden" name="imageUrl" value={img} />
                                        <button className="p-2 bg-white text-red-600 rounded-full hover:scale-110 transition-transform shadow-lg">
                                            <Trash weight="bold" className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}

                        {/* Upload Button */}
                        {currentImages.length < tierLimit && (
                            <form action={uploadMockPhoto} className="aspect-square">
                                <input type="hidden" name="id" value={listing.id} />
                                {/* Quick mock upload selector */}
                                <input type="hidden" name="upload" value={String((currentImages.length % 3) + 1)} />
                                <button
                                    type="submit"
                                    className="w-full h-full rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all outline-none"
                                >
                                    <Plus weight="bold" className="w-8 h-8" />
                                    <span className="text-sm font-bold">Add Photo</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
