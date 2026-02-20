"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  PawPrint,
  Dog,
  Cat,
  Scissors,
  MapPin,
  User,
} from "@phosphor-icons/react/dist/ssr";

const steps = ["Pet Info", "Services", "Location & Time", "Contact"];

const petSizes = [
  { value: "small", label: "Small", desc: "Under 20 lbs" },
  { value: "medium", label: "Medium", desc: "20-50 lbs" },
  { value: "large", label: "Large", desc: "50-90 lbs" },
  { value: "xlarge", label: "X-Large", desc: "90+ lbs" },
];

const serviceOptions = [
  "Full Groom (Bath + Haircut)",
  "Bath & Brush Only",
  "Nail Trimming",
  "De-Shedding Treatment",
  "Teeth Brushing",
  "Ear Cleaning",
  "Flea Treatment",
  "Creative Grooming / Color",
  "Puppy First Groom",
  "Senior Pet Package",
];

export function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    petType: "" as string,
    petName: "",
    petBreed: "",
    petSize: "",
    services: [] as string[],
    city: "",
    preferredDate: "",
    preferredTime: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const updateForm = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    const services = form.services.includes(service)
      ? form.services.filter((s) => s !== service)
      : [...form.services, service];
    updateForm("services", services);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle weight="fill" className="h-10 w-10 text-success" />
        </div>
        <h2 className="font-[family-name:var(--font-fredoka)] text-3xl font-bold text-brand-primary mb-3">
          Pawsome! You&apos;re all set!
        </h2>
        <p className="text-text-muted max-w-md mx-auto mb-2">
          We&apos;re fetching quotes from the best groomers in{" "}
          <strong>{form.city || "your area"}</strong>. Expect to hear back
          within 24 hours.
        </p>
        <p className="text-sm text-text-muted">
          {form.petName && (
            <>
              <PawPrint weight="fill" className="inline w-3 h-3 mr-1" />
              {form.petName} is going to look amazing!
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${i === step
                  ? "bg-brand-secondary text-white"
                  : i < step
                    ? "bg-success text-white"
                    : "bg-surface text-text-muted"
                }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`hidden sm:block text-xs font-medium ${i === step ? "text-brand-primary" : "text-text-muted"
                }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className="hidden sm:block w-8 lg:w-16 h-[2px] bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Pet Info */}
      {step === 0 && (
        <div className="space-y-6">
          <h3 className="font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-brand-primary">
            Tell us about your fur baby
          </h3>

          <div>
            <label className="text-sm font-medium text-text mb-2 block">
              What kind of pet?
            </label>
            <div className="flex gap-3">
              {[
                { value: "dog", label: "Dog", icon: Dog },
                { value: "cat", label: "Cat", icon: Cat },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateForm("petType", value)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-semibold transition-colors ${form.petType === value
                      ? "border-brand-accent bg-brand-accent/5 text-brand-accent"
                      : "border-border hover:border-brand-accent/50"
                    }`}
                >
                  <Icon weight="duotone" className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">
                Pet&apos;s Name
              </label>
              <input
                type="text"
                value={form.petName}
                onChange={(e) => updateForm("petName", e.target.value)}
                placeholder="e.g. Maui"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">
                Breed
              </label>
              <input
                type="text"
                value={form.petBreed}
                onChange={(e) => updateForm("petBreed", e.target.value)}
                placeholder="e.g. Goldendoodle"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-2 block">
              Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {petSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => updateForm("petSize", size.value)}
                  className={`rounded-xl border-2 p-3 text-center transition-colors ${form.petSize === size.value
                      ? "border-brand-accent bg-brand-accent/5"
                      : "border-border hover:border-brand-accent/50"
                    }`}
                >
                  <p className="text-sm font-semibold text-brand-primary">
                    {size.label}
                  </p>
                  <p className="text-[11px] text-text-muted">{size.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Services */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-brand-primary">
            What does {form.petName || "your pup"} need?
          </h3>
          <p className="text-sm text-text-muted">
            Select all that apply — groomers will customize their quotes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {serviceOptions.map((service) => (
              <button
                key={service}
                onClick={() => toggleService(service)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${form.services.includes(service)
                    ? "border-brand-accent bg-brand-accent/5 text-brand-accent"
                    : "border-border hover:border-brand-accent/50 text-text"
                  }`}
              >
                <Scissors weight="bold" className="h-4 w-4 flex-shrink-0" />
                {service}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Location & Timing */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-brand-primary">
            Where and when?
          </h3>

          <div>
            <label className="text-sm font-medium text-text mb-1.5 block">
              City or ZIP Code
            </label>
            <div className="relative">
              <MapPin weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                placeholder="e.g. Seattle, WA or 98122"
                className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">
                Preferred Date
              </label>
              <input
                type="date"
                value={form.preferredDate}
                onChange={(e) => updateForm("preferredDate", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">
                Preferred Time
              </label>
              <select
                value={form.preferredTime}
                onChange={(e) => updateForm("preferredTime", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">Any time</option>
                <option value="morning">Morning (8am-12pm)</option>
                <option value="afternoon">Afternoon (12pm-4pm)</option>
                <option value="evening">Evening (4pm-7pm)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Contact */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-brand-primary">
            Almost there! How can groomers reach you?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-text mb-1.5 block">
                Your Name
              </label>
              <div className="relative">
                <User weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text mb-1.5 block">
              Anything else we should know?
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              placeholder="e.g. My dog is anxious around dryers, prefers a teddy bear cut..."
              rows={3}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-text-muted hover:bg-surface transition-colors"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 rounded-full bg-brand-secondary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-secondary/90 transition-colors"
          >
            Next <ArrowRight weight="bold" className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
          >
            <PawPrint weight="fill" className="h-4 w-4" />
            Fetch My Quotes
          </button>
        )}
      </div>
    </div>
  );
}
