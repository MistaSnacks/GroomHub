"use client";

import { useState } from "react";
import { PaperPlaneRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";

interface ContactFormProps {
    listingId: string;
    listingName: string;
}

export function ContactForm({ listingId, listingName }: ContactFormProps) {
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus("submitting");

        const formData = new FormData(e.currentTarget);

        // In a real app this would hit a Server Action to insert into the `leads` table
        // For this epic, we are mocking the submission success state
        setTimeout(() => {
            setStatus("success");
            // Reset form could go here
        }, 1500);
    }

    if (status === "success") {
        return (
            <div className="rounded-2xl border border-brand-secondary bg-brand-secondary/10 p-6 text-center">
                <CheckCircle weight="fill" className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                <h3 className="font-heading text-lg font-bold text-brand-primary mb-2">Message Sent!</h3>
                <p className="text-sm text-text-muted">
                    {listingName} has received your request and will be in touch shortly.
                </p>
                <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm font-bold text-brand-primary hover:underline hover:text-brand-accent transition-colors"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-4">
            <div className="mb-2">
                <h3 className="font-heading text-lg font-bold text-brand-primary">Contact This Groomer</h3>
                <p className="text-xs text-text-muted">Send a direct message to request an appointment or ask questions.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-text mb-1">Your Name *</label>
                <input
                    name="name"
                    required
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    placeholder="Jane Doe"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-text mb-1">Email *</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                        placeholder="jane@example.com"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-text mb-1">Phone</label>
                    <input
                        name="phone"
                        type="tel"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                        placeholder="(555) 123-4567"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-text mb-1">Pet Details</label>
                <input
                    name="pet_details"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    placeholder="E.g. Buster, 60lb Golden Doodle"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-text mb-1">Message *</label>
                <textarea
                    name="message"
                    required
                    rows={3}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-none"
                    placeholder="What services are you looking for?"
                />
            </div>

            <button
                type="submit"
                disabled={status === "submitting"}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 shadow-sm disabled:opacity-70"
            >
                {status === "submitting" ? "Sending..." : "Send Message"}
                {!status && <PaperPlaneRight weight="bold" className="w-4 h-4" />}
            </button>
        </form>
    );
}
