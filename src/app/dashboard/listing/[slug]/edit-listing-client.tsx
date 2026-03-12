"use client";

import { useState } from "react";
import { FloppyDisk, MapPin, Info } from "@phosphor-icons/react/dist/ssr";
import { updateListing } from "../../actions";

interface EditListingClientProps {
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
}

export function EditListingClient(props: EditListingClientProps) {
  const [name, setName] = useState(props.name);
  const [shortDescription, setShortDescription] = useState(props.shortDescription);
  const [description, setDescription] = useState(props.description);
  const [phone, setPhone] = useState(props.phone);
  const [email, setEmail] = useState(props.email);
  const [website, setWebsite] = useState(props.website);

  return (
    <form action={updateListing} className="space-y-8">
      <input type="hidden" name="slug" value={props.slug} />

      {/* Basic Info */}
      <div className="bg-bg/50 rounded-2xl border border-border p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-primary mb-4">
          Basic Info
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="name">
              Business Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="short_description">
              Short Description
            </label>
            <textarea
              id="short_description"
              name="short_description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
              maxLength={200}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
            />
            <p className="text-xs text-text-muted mt-1">{shortDescription.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="description">
              Full Description
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-bg/50 rounded-2xl border border-border p-6">
        <h2 className="font-heading text-lg font-semibold text-brand-primary mb-4">
          Contact Info
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="phone">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5" htmlFor="website">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      {/* Location (read-only) */}
      <div className="bg-bg/50 rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin weight="duotone" className="w-5 h-5 text-brand-secondary" />
          <h2 className="font-heading text-lg font-semibold text-brand-primary">
            Location
          </h2>
        </div>
        <p className="text-sm text-brand-primary">{props.address}</p>
        <p className="text-sm text-text-muted">{props.city}, {props.state} {props.zip}</p>
        <div className="flex items-start gap-1.5 mt-3 p-3 bg-white rounded-xl border border-border">
          <Info weight="fill" className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted">Contact support to update your address.</p>
        </div>
      </div>

      {/* Services (read-only) */}
      {(props.services.length > 0 || props.specialties.length > 0) && (
        <div className="bg-bg/50 rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold text-brand-primary mb-4">
            Services & Specialties
          </h2>
          {props.services.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-text-muted mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {props.services.map((s) => (
                  <span key={s} className="text-xs font-medium text-text-muted bg-white rounded-full px-2.5 py-1 border border-border">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {props.specialties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-2">Specialties</p>
              <div className="flex flex-wrap gap-1.5">
                {props.specialties.map((s) => (
                  <span key={s} className="text-xs font-medium text-text-muted bg-white rounded-full px-2.5 py-1 border border-border">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-start gap-1.5 mt-3 p-3 bg-white rounded-xl border border-border">
            <Info weight="fill" className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted">Contact support to update services and specialties.</p>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-3.5 text-sm font-bold text-white hover:bg-brand-primary/90 hover:scale-[1.02] transition-all shadow-md"
        >
          <FloppyDisk weight="bold" className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </form>
  );
}
