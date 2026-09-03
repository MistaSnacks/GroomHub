"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Globe,
  EnvelopeSimple,
  ImageSquare,
  Camera,
  Trash,
  FloppyDisk,
  Plus,
  X,
  SpinnerGap,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { updateListing } from "../../actions";
import {
  uploadPhoto,
  deletePhoto,
  deletePhotos,
  uploadLogo,
  deleteLogo,
} from "../../photos/actions";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import { getLimits } from "@/lib/tiers";
import { usableListingImages } from "@/lib/images";
import type { DayHours } from "@/lib/types";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface EditListingClientProps {
  listingId: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  services: string[];
  specialties: string[];
  hours: DayHours[];
  images: string[];
  logoUrl: string;
  subscriptionTier: string;
}

function initHours(existing: DayHours[]): DayHours[] {
  const list = Array.isArray(existing) ? existing : [];
  return DAYS.map((day) => {
    const found = list.find((h) => h.day === day);
    return found || { day, open: "09:00", close: "17:00", closed: false };
  });
}

const MAX_CLIENT_FILE_SIZE = 5 * 1024 * 1024;

const inputClass =
  "bg-transparent border-b border-transparent hover:border-border focus:border-brand-primary outline-none transition-colors w-full";

export function EditListingClient(props: EditListingClientProps) {
  // Basic fields
  const [name, setName] = useState(props.name);
  const [shortDescription, setShortDescription] = useState(
    props.shortDescription
  );
  const [description, setDescription] = useState(props.description);
  const [phone, setPhone] = useState(props.phone);
  const [email, setEmail] = useState(props.email);
  const [website, setWebsite] = useState(props.website);
  const [address, setAddress] = useState(props.address);
  const [city, setCity] = useState(props.city);
  const [state, setState] = useState(props.state);
  const [zip, setZip] = useState(props.zip);

  // Tags
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    () => new Set(props.services)
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(
    () => new Set(props.specialties)
  );

  // Hours
  const [editHours, setEditHours] = useState<DayHours[]>(() =>
    initHours(props.hours)
  );

  // Photos and logo
  const [images, setImages] = useState<string[]>(props.images);
  const [logoUrl, setLogoUrl] = useState(props.logoUrl);

  // UI state
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(
    null
  );
  const [saveError, setSaveError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const limits = getLimits(props.subscriptionTier);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // -- Tag toggles --
  function toggleService(label: string) {
    const next = new Set(selectedServices);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setSelectedServices(next);
    setIsDirty(true);
  }

  function toggleSpecialty(label: string) {
    const next = new Set(selectedSpecialties);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setSelectedSpecialties(next);
    setIsDirty(true);
  }

  // -- Hours --
  function updateHour(
    index: number,
    field: keyof DayHours,
    value: string | boolean
  ) {
    setEditHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
    setIsDirty(true);
  }

  // -- Photo upload --
  const handlePhotoUpload = useCallback(
    async (files: File[]) => {
      setPhotoError("");
      if (images.length + files.length > limits.photos) {
        setPhotoError(
          `Photo limit is ${limits.photos}. You can add ${limits.photos - images.length} more.`
        );
        return;
      }
      setUploadingPhotos(true);
      try {
        for (const file of files) {
          if (file.size > MAX_CLIENT_FILE_SIZE) {
            setPhotoError("File must be under 5MB.");
            break;
          }
          const formData = new FormData();
          formData.set("listingId", props.listingId);
          formData.set("file", file);
          const result = await uploadPhoto(formData);
          if (result && "error" in result && result.error) {
            setPhotoError(result.error || "An error occurred");
            break;
          }
          if (result && "url" in result && result.url) {
            setImages((prev) => [...prev, result.url]);
          }
        }
      } finally {
        setUploadingPhotos(false);
      }
    },
    [images.length, limits.photos, props.listingId]
  );

  const handlePhotoDelete = useCallback(
    async (imageUrl: string) => {
      const formData = new FormData();
      formData.set("listingId", props.listingId);
      formData.set("imageUrl", imageUrl);
      const result = await deletePhoto(formData);
      if (result && "error" in result) {
        setPhotoError(result.error || "An error occurred");
        return;
      }
      setImages((prev) => prev.filter((img) => img !== imageUrl));
    },
    [props.listingId]
  );

  // -- Multi-select photo delete --
  function togglePhotoSelect(url: string) {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  const handleBulkDelete = useCallback(async () => {
    if (selectedPhotos.size === 0) return;
    const count = selectedPhotos.size;
    if (!confirm(`Delete ${count} photo${count > 1 ? "s" : ""}? This cannot be undone.`)) return;

    setBulkDeleting(true);
    setPhotoError("");
    const urls = Array.from(selectedPhotos);
    const result = await deletePhotos(props.listingId, urls);
    if (result && "error" in result) {
      setPhotoError(result.error || "An error occurred");
    } else {
      setImages((prev) => prev.filter((img) => !selectedPhotos.has(img)));
      setSelectedPhotos(new Set());
    }
    setBulkDeleting(false);
  }, [selectedPhotos, props.listingId]);

  // -- Logo upload --
  const handleLogoUpload = useCallback(
    async (file: File) => {
      setLogoError("");
      if (file.size > MAX_CLIENT_FILE_SIZE) {
        setLogoError("File must be under 5MB.");
        return;
      }
      setUploadingLogo(true);
      try {
        const formData = new FormData();
        formData.set("listingId", props.listingId);
        formData.set("file", file);
        const result = await uploadLogo(formData);
        if (result && "error" in result) {
          setLogoError(result.error || "An error occurred");
          return;
        }
        if (result && "url" in result && result.url) {
          setLogoUrl(result.url);
        }
      } finally {
        setUploadingLogo(false);
      }
    },
    [props.listingId]
  );

  const handleLogoDelete = useCallback(async () => {
    setLogoError("");
    const formData = new FormData();
    formData.set("listingId", props.listingId);
    const result = await deleteLogo(formData);
    if (result && "error" in result) {
      setLogoError(result.error || "An error occurred");
      return;
    }
    setLogoUrl("");
  }, [props.listingId]);

  // -- Drag and drop for gallery --
  function handleGalleryDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingGallery(true);
  }
  function handleGalleryDragLeave() {
    setIsDraggingGallery(false);
  }
  async function handleGalleryDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingGallery(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) {
      await handlePhotoUpload(files);
    }
  }

  // -- Drag and drop for logo --
  function handleLogoDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingLogo(true);
  }
  function handleLogoDragLeave() {
    setIsDraggingLogo(false);
  }
  async function handleLogoDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await handleLogoUpload(file);
    }
  }

  // -- Save handler --
  async function handleSave(formData: FormData) {
    setSaving(true);
    setSaveResult(null);
    setSaveError("");
    try {
      const result = await updateListing(formData);
      if (result && "error" in result) {
        setSaveResult("error");
        setSaveError(result.error || "Something went wrong. Please try again.");
      } else {
        setSaveResult("success");
        setIsDirty(false);
      }
    } catch {
      setSaveResult("error");
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Filter out placeholder images (same as public profile)
  const realImages = usableListingImages(images);

  return (
    <form action={handleSave} onChange={() => setIsDirty(true)} className="space-y-8">
      <input type="hidden" name="slug" value={props.slug} />
      <input
        type="hidden"
        name="services"
        value={JSON.stringify([...selectedServices])}
      />
      <input
        type="hidden"
        name="specialties"
        value={JSON.stringify([...selectedSpecialties])}
      />
      <input
        type="hidden"
        name="hours"
        value={JSON.stringify(editHours)}
      />

      {/* ─── Hero Section ─── */}
      <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-4 mb-4">
          {/* Logo upload area */}
          <div
            className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 cursor-pointer transition-all ${
              isDraggingLogo
                ? "border-2 border-brand-primary bg-brand-primary/5 scale-105"
                : logoUrl
                  ? "border border-border shadow-sm hover:shadow-md"
                  : "border-2 border-dashed border-border hover:border-brand-secondary bg-gradient-to-br from-surface to-brand-secondary/5"
            }`}
            onDragOver={handleLogoDragOver}
            onDragLeave={handleLogoDragLeave}
            onDrop={handleLogoDrop}
            onClick={() => logoInputRef.current?.click()}
          >
            {uploadingLogo ? (
              <div className="flex items-center justify-center w-full h-full">
                <SpinnerGap
                  weight="bold"
                  className="w-6 h-6 text-brand-secondary animate-spin"
                />
              </div>
            ) : logoUrl ? (
              <>
                <Image
                  src={logoUrl}
                  alt="Business logo"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <Camera weight="bold" className="w-4 h-4 text-white mb-0.5" />
                  <span className="text-[10px] font-medium text-white">Change</span>
                </div>
                <button
                  type="button"
                  aria-label="Remove logo"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogoDelete();
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <X weight="bold" className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-text-muted/40 hover:text-brand-secondary transition-colors">
                <Camera weight="duotone" className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Add logo</span>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Business name */}
          <div className="flex-1 min-w-0">
            <label htmlFor="edit-name" className="sr-only">Business name</label>
            <input
              id="edit-name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} font-heading text-2xl sm:text-3xl font-bold text-brand-primary py-1`}
              placeholder="Business Name"
              required
              maxLength={120}
            />
          </div>
        </div>

        {logoError && (
          <p className="text-xs text-[#C2185B] mb-3">{logoError}</p>
        )}

        {/* Address, contact fields - styled like the public profile info row */}
        <div className="space-y-3 text-sm text-text-muted">
          {/* Address row */}
          <div className="flex items-start gap-1.5">
            <MapPin weight="fill" className="h-4 w-4 shrink-0 mt-2" />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label htmlFor="edit-address" className="sr-only">Street address</label>
                <input
                  id="edit-address"
                  type="text"
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`${inputClass} text-sm py-1`}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label htmlFor="edit-city" className="sr-only">City</label>
                <input
                  id="edit-city"
                  type="text"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`${inputClass} text-sm py-1`}
                  placeholder="City"
                />
              </div>
              <div className="flex gap-2">
                <div>
                  <label htmlFor="edit-state" className="sr-only">State</label>
                  <input
                    id="edit-state"
                    type="text"
                    name="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={`${inputClass} text-sm py-1 w-16`}
                    placeholder="ST"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label htmlFor="edit-zip" className="sr-only">Zip</label>
                  <input
                    id="edit-zip"
                    type="text"
                    name="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className={`${inputClass} text-sm py-1 w-24`}
                    placeholder="Zip"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-1.5">
            <Phone weight="fill" className="h-4 w-4 shrink-0" />
            <label htmlFor="edit-phone" className="sr-only">Phone number</label>
            <input
              id="edit-phone"
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputClass} text-sm py-1`}
              placeholder="Phone number"
            />
          </div>

          {/* Email */}
          <div className="flex items-center gap-1.5">
            <EnvelopeSimple weight="fill" className="h-4 w-4 shrink-0" />
            <label htmlFor="edit-email" className="sr-only">Email address</label>
            <input
              id="edit-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} text-sm py-1`}
              placeholder="Email address"
            />
          </div>

          {/* Website */}
          <div className="flex items-center gap-1.5">
            <Globe weight="bold" className="h-4 w-4 shrink-0" />
            <label htmlFor="edit-website" className="sr-only">Website</label>
            <input
              id="edit-website"
              type="url"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={`${inputClass} text-sm py-1 text-brand-accent`}
              placeholder="https://your-website.com"
            />
          </div>
        </div>
      </div>

      {/* ─── Gallery Section ─── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-brand-primary">
            Gallery
          </h2>
          <div className="flex items-center gap-2">
            {selectedPhotos.size > 0 ? (
              <>
                <span className="text-sm font-medium text-brand-primary">
                  {selectedPhotos.size} selected
                </span>
                {selectedPhotos.size < realImages.length && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhotos(new Set(realImages))}
                    className="text-xs font-bold text-brand-secondary hover:text-brand-secondary/80 transition-colors"
                  >
                    Select all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPhotos(new Set())}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all"
                >
                  <X weight="bold" className="w-3 h-3" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#C2185B] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#AD1457] transition-all disabled:opacity-50"
                >
                  <Trash weight="bold" className="w-3.5 h-3.5" />
                  {bulkDeleting ? "Deleting..." : `Delete ${selectedPhotos.size}`}
                </button>
              </>
            ) : (
              <span className="text-sm text-text-muted">
                {realImages.length}/{limits.photos} photos
              </span>
            )}
          </div>
        </div>

        {photoError && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
            <WarningCircle weight="fill" className="w-4 h-4 shrink-0" />
            {photoError}
          </div>
        )}

        <div
          className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
            isDraggingGallery
              ? "border-brand-primary bg-brand-primary/5"
              : "border-border"
          }`}
          onDragOver={handleGalleryDragOver}
          onDragLeave={handleGalleryDragLeave}
          onDrop={handleGalleryDrop}
        >
          {realImages.length > 1 && selectedPhotos.size === 0 && (
            <p className="text-xs text-text-muted/50 mb-3">
              Click photos to select multiple, then delete at once.
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Existing photos */}
            {realImages.map((img, i) => {
              const isSelected = selectedPhotos.has(img);
              const selectMode = selectedPhotos.size > 0;

              return (
                <div key={`${img}-${i}`} className="relative aspect-square group">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={isSelected ? `Deselect photo ${i + 1}` : `Select photo ${i + 1}`}
                    className={`absolute inset-0 rounded-xl overflow-hidden bg-surface cursor-pointer border-2 transition-all text-left ${
                      isSelected
                        ? "border-[#C2185B] ring-2 ring-[#C2185B]/30"
                        : "border-transparent hover:border-brand-primary/30"
                    }`}
                    onClick={() => togglePhotoSelect(img)}
                  >
                    <Image
                      src={img}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />

                    <div className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected || selectMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#C2185B] text-white" : "bg-white/80 text-text-muted border border-border"
                      }`}>
                        <CheckCircle weight={isSelected ? "fill" : "regular"} className="w-4 h-4" />
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute inset-0 bg-[#C2185B]/10" />
                    )}
                  </button>
                  {!selectMode && (
                    <button
                      type="button"
                      aria-label={`Delete photo ${i + 1}`}
                      onClick={() => handlePhotoDelete(img)}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <X weight="bold" className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Upload zone */}
            {realImages.length < limits.photos && selectedPhotos.size === 0 && (
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square rounded-xl bg-gradient-to-br from-surface to-brand-secondary/5 flex flex-col items-center justify-center hover:from-brand-secondary/5 hover:to-brand-secondary/10 transition-colors cursor-pointer"
              >
                {uploadingPhotos ? (
                  <SpinnerGap
                    weight="bold"
                    className="w-8 h-8 text-brand-secondary animate-spin"
                  />
                ) : (
                  <>
                    <Plus
                      weight="bold"
                      className="w-8 h-8 text-text-muted/30 mb-1"
                    />
                    <span className="text-xs text-text-muted/40 font-medium">
                      Add photo
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Empty placeholders if no photos */}
            {realImages.length === 0 &&
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="aspect-square rounded-xl bg-gradient-to-br from-surface to-brand-secondary/5 flex flex-col items-center justify-center"
                >
                  <ImageSquare
                    weight="duotone"
                    className="w-10 h-10 text-text-muted/20 mb-1"
                  />
                  <span className="text-xs text-text-muted/30 font-medium">
                    Photo here
                  </span>
                </div>
              ))}
          </div>

          {/* Drop zone hint */}
          {selectedPhotos.size === 0 && (
            <p className="text-center text-xs text-text-muted/50 mt-3">
              Drop photos here or click the + to browse.{" "}
              {realImages.length}/{limits.photos} photos used.
            </p>
          )}
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) handlePhotoUpload(files);
            e.target.value = "";
          }}
        />
      </div>

      {/* ─── Services Section ─── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-heading text-xl font-semibold text-brand-primary mb-2">
          Services
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Select the services your business offers. Tap to toggle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICE_TAGS.map((tag) => {
            const isSelected = selectedServices.has(tag.label);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => toggleService(tag.label)}
                className={`rounded-xl p-3 text-left border transition-all ${
                  isSelected
                    ? "bg-brand-secondary/5 border-brand-secondary/30"
                    : "bg-surface/50 border-transparent hover:border-border"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isSelected ? "text-brand-primary" : "text-text-muted"
                  }`}
                >
                  {tag.label}
                </span>
                {tag.description && (
                  <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                    {tag.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Specialties Section ─── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-heading text-xl font-semibold text-brand-primary mb-2">
          Specialties
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Highlight what makes your business unique. Tap to toggle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SPECIALTY_TAGS.map((tag) => {
            const isSelected = selectedSpecialties.has(tag.label);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => toggleSpecialty(tag.label)}
                className={`rounded-xl p-3 text-left border transition-all ${
                  isSelected
                    ? "bg-brand-accent/5 border-brand-accent/30"
                    : "bg-surface/50 border-transparent hover:border-border"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isSelected ? "text-brand-primary" : "text-text-muted"
                  }`}
                >
                  {tag.label}
                </span>
                {tag.description && (
                  <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                    {tag.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── About Section ─── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
          About {name || "Your Business"}
        </h2>
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium text-text-muted mb-1.5"
              htmlFor="short_description"
            >
              Short description (shown on cards)
            </label>
            <textarea
              id="short_description"
              name="short_description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full rounded-xl border border-border bg-surface/30 px-4 py-3 text-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
              placeholder="A brief summary of your business..."
            />
            <p className="text-xs text-text-muted mt-1 text-right">
              {shortDescription.length}/300
            </p>
          </div>

          <div>
            <label
              className="block text-xs font-medium text-text-muted mb-1.5"
              htmlFor="description"
            >
              Full description
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={5000}
              className="w-full rounded-xl border border-border bg-surface/30 px-4 py-3 text-sm leading-relaxed transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
              placeholder="Tell pet parents about your experience, approach, and what makes your business special..."
            />
          </div>
        </div>
      </div>

      {/* ─── Hours Section ─── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
          Business Hours
        </h2>
        <div className="divide-y divide-border">
          {editHours.map((h, i) => (
            <div
              key={h.day}
              className="flex items-center justify-between py-3 gap-3 flex-wrap sm:flex-nowrap"
            >
              <span className="text-sm font-medium text-text w-24 shrink-0">
                {h.day}
              </span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                {h.closed ? (
                  <span className="text-sm text-fun-pop font-medium mr-auto sm:mr-0">
                    Closed
                  </span>
                ) : (
                  <>
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHour(i, "open", e.target.value)}
                      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm transition-colors focus:border-brand-primary outline-none"
                    />
                    <span className="text-xs text-text-muted">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHour(i, "close", e.target.value)}
                      className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm transition-colors focus:border-brand-primary outline-none"
                    />
                  </>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={h.closed}
                    onChange={(e) => updateHour(i, "closed", e.target.checked)}
                    className="rounded border-border text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-xs text-text-muted">Closed</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Save Bar ─── */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl border border-border bg-white/95 backdrop-blur-sm p-4 shadow-lg flex items-center justify-between gap-4">
          {saveResult === "success" && (
            <div className="flex items-center gap-2 text-sm text-brand-primary">
              <CheckCircle weight="fill" className="w-5 h-5 text-brand-secondary" />
              Saved successfully
            </div>
          )}
          {saveResult === "error" && (
            <div className="flex items-center gap-2 text-sm text-[#C2185B]">
              <WarningCircle weight="fill" className="w-5 h-5" />
              {saveError || "Something went wrong. Please try again."}
            </div>
          )}
          {!saveResult && (
            <p className="text-xs text-text-muted hidden sm:block">
              {isDirty ? "You have unsaved changes." : "Changes are saved when you click the button."}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white hover:bg-brand-primary/90 hover:scale-[1.02] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed ml-auto"
          >
            {saving ? (
              <SpinnerGap
                weight="bold"
                className="w-4 h-4 animate-spin"
              />
            ) : (
              <FloppyDisk weight="bold" className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
