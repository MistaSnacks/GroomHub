"use client";

import { useState } from "react";
import { FloppyDisk, MapPin, Info, Clock, Tag } from "@phosphor-icons/react/dist/ssr";
import { updateListing } from "../../actions";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import type { DayHours } from "@/lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  hours: DayHours[];
}

function initHours(existing: DayHours[]): DayHours[] {
  return DAYS.map((day) => {
    const found = existing.find((h) => h.day === day);
    return found || { day, open: "09:00", close: "17:00", closed: false };
  });
}

export function EditListingClient(props: EditListingClientProps) {
  const [name, setName] = useState(props.name);
  const [shortDescription, setShortDescription] = useState(props.shortDescription);
  const [description, setDescription] = useState(props.description);
  const [phone, setPhone] = useState(props.phone);
  const [email, setEmail] = useState(props.email);
  const [website, setWebsite] = useState(props.website);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    () => new Set(props.services)
  );
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(
    () => new Set(props.specialties)
  );
  const [editHours, setEditHours] = useState<DayHours[]>(() => initHours(props.hours));

  function toggleService(label: string) {
    const next = new Set(selectedServices);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setSelectedServices(next);
  }

  function toggleSpecialty(label: string) {
    const next = new Set(selectedSpecialties);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setSelectedSpecialties(next);
  }

  function updateHour(index: number, field: keyof DayHours, value: string | boolean) {
    setEditHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  }

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

      {/* Services */}
      <div className="bg-bg/50 rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag weight="duotone" className="w-5 h-5 text-brand-secondary" />
          <h2 className="font-heading text-lg font-semibold text-brand-primary">
            Services
          </h2>
        </div>
        <p className="text-xs text-text-muted mb-3">
          Select the services your business offers. Tap to toggle.
        </p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_TAGS.map((tag) => {
            const isSelected = selectedServices.has(tag.label);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => toggleService(tag.label)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  isSelected
                    ? "bg-brand-accent/10 text-brand-accent border-brand-accent/30"
                    : "bg-white text-text-muted border-border hover:border-brand-accent/30"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-bg/50 rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag weight="duotone" className="w-5 h-5 text-brand-accent" />
          <h2 className="font-heading text-lg font-semibold text-brand-primary">
            Specialties
          </h2>
        </div>
        <p className="text-xs text-text-muted mb-3">
          Highlight what makes your business unique. Tap to toggle.
        </p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_TAGS.map((tag) => {
            const isSelected = selectedSpecialties.has(tag.label);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => toggleSpecialty(tag.label)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  isSelected
                    ? "bg-brand-accent/10 text-brand-accent border-brand-accent/30"
                    : "bg-white text-text-muted border-border hover:border-brand-accent/30"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-bg/50 rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock weight="duotone" className="w-5 h-5 text-brand-secondary" />
          <h2 className="font-heading text-lg font-semibold text-brand-primary">
            Business Hours
          </h2>
        </div>
        <div className="space-y-3">
          {editHours.map((h, i) => (
            <div
              key={h.day}
              className="flex items-center gap-3 flex-wrap sm:flex-nowrap"
            >
              <span className="text-sm font-medium text-brand-primary w-24 shrink-0">
                {h.day}
              </span>
              <input
                type="time"
                value={h.open}
                disabled={h.closed}
                onChange={(e) => updateHour(i, "open", e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <span className="text-xs text-text-muted">to</span>
              <input
                type="time"
                value={h.close}
                disabled={h.closed}
                onChange={(e) => updateHour(i, "close", e.target.value)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <label className="flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={(e) => updateHour(i, "closed", e.target.checked)}
                  className="rounded border-border text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-xs text-text-muted">Closed</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden inputs for services, specialties, hours */}
      <input type="hidden" name="services" value={JSON.stringify([...selectedServices])} />
      <input type="hidden" name="specialties" value={JSON.stringify([...selectedSpecialties])} />
      <input type="hidden" name="hours" value={JSON.stringify(editHours)} />

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
