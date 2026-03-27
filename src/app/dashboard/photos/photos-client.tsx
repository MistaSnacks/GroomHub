"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Image as ImageIcon, Plus, Trash, Upload, User } from "@phosphor-icons/react/dist/ssr";
import { uploadPhoto, deletePhoto, uploadLogo, deleteLogo } from "./actions";

interface PhotosClientProps {
  listingId: string;
  currentImages: string[];
  logoUrl: string | null;
  maxPhotos: number;
}

export function PhotosClient({ listingId, currentImages, logoUrl, maxPhotos }: PhotosClientProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("listingId", listingId);
      formData.set("file", file);
      const result = await uploadPhoto(formData);
      if (result.error) {
        setError(result.error);
        break;
      }
    }

    setUploading(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("file", file);
    const result = await uploadLogo(formData);
    if (result.error) setError(result.error);

    setUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleDeletePhoto(imageUrl: string) {
    setError(null);
    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("imageUrl", imageUrl);
    const result = await deletePhoto(formData);
    if (result.error) setError(result.error);
  }

  async function handleDeleteLogo() {
    setError(null);
    const formData = new FormData();
    formData.set("listingId", listingId);
    const result = await deleteLogo(formData);
    if (result.error) setError(result.error);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
          {error}
        </div>
      )}

      {uploading && (
        <div className="p-3 text-sm text-brand-primary bg-brand-secondary/10 rounded-xl border border-brand-secondary/30">
          Uploading...
        </div>
      )}

      {/* Logo Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50/50 flex items-center gap-3">
          <User className="w-5 h-5 text-brand-secondary" weight="duotone" />
          <h2 className="font-heading text-lg font-bold text-brand-primary">
            Business Logo
          </h2>
        </div>
        <div className="p-6 flex items-center gap-6">
          {logoUrl ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
              <Image src={logoUrl} alt="Business logo" fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-surface to-brand-secondary/5 flex items-center justify-center border border-border shrink-0">
              <User weight="duotone" className="w-8 h-8 text-text-muted/25" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary/90 transition-all disabled:opacity-50"
              >
                <Upload weight="bold" className="w-3.5 h-3.5" />
                {logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-text-muted hover:text-[#C2185B] hover:border-[#C2185B] transition-all disabled:opacity-50"
                >
                  <Trash weight="bold" className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-text-muted">JPEG, PNG, or WebP. Max 5MB.</p>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Gallery Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-brand-secondary" weight="duotone" />
            <h2 className="font-heading text-lg font-bold text-brand-primary">
              Gallery Photos
            </h2>
          </div>
          <div className="text-sm font-medium text-text-muted bg-white px-3 py-1 rounded-full border border-border shadow-sm">
            {currentImages.length} photos
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border relative group">
                <Image src={img} alt={`Gallery ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(img)}
                    className="p-2 bg-white text-red-600 rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    <Trash weight="bold" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {currentImages.length < maxPhotos && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all disabled:opacity-50"
              >
                <Plus weight="bold" className="w-8 h-8" />
                <span className="text-sm font-bold">Add Photo</span>
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
