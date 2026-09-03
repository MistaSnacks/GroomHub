"use client";

import { useState, useTransition } from "react";
import { PaperPlaneRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { sendGroomerMessage } from "@/app/groomer/[slug]/actions";

interface ContactFormProps {
    listingId: string;
    listingSlug: string;
    listingName: string;
}

const inputClass =
    "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none";

export function ContactForm({ listingId, listingSlug, listingName }: ContactFormProps) {
    const [status, setStatus] = useState<"idle" | "success">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        setErrorMsg("");

        startTransition(async () => {
            const result = await sendGroomerMessage(formData);
            if (result.ok) {
                form.reset();
                setStatus("success");
            } else {
                setErrorMsg(result.error);
            }
        });
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
                    type="button"
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
            <input type="hidden" name="listingId" value={listingId} />
            <input type="hidden" name="listingSlug" value={listingSlug} />
            <input
                type="text"
                name="hp_field"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            />

            <div className="mb-2">
                <h3 className="font-heading text-lg font-bold text-brand-primary">Contact This Groomer</h3>
                <p className="text-xs text-text-muted">Send a direct message to request an appointment or ask questions.</p>
            </div>

            {errorMsg && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMsg}
                </p>
            )}

            <div>
                <label htmlFor="groomer-contact-name" className="block text-xs font-bold text-text mb-1">Your Name *</label>
                <input
                    id="groomer-contact-name"
                    name="name"
                    required
                    maxLength={120}
                    className={inputClass}
                    placeholder="Jane Doe"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="groomer-contact-email" className="block text-xs font-bold text-text mb-1">Email *</label>
                    <input
                        id="groomer-contact-email"
                        name="email"
                        type="email"
                        required
                        className={inputClass}
                        placeholder="jane@example.com"
                    />
                </div>
                <div>
                    <label htmlFor="groomer-contact-phone" className="block text-xs font-bold text-text mb-1">Phone</label>
                    <input
                        id="groomer-contact-phone"
                        name="phone"
                        type="tel"
                        maxLength={40}
                        className={inputClass}
                        placeholder="(555) 123-4567"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="groomer-contact-pet" className="block text-xs font-bold text-text mb-1">Pet Details</label>
                <input
                    id="groomer-contact-pet"
                    name="pet_details"
                    className={inputClass}
                    placeholder="E.g. Buster, 60lb Golden Doodle"
                />
            </div>

            <div>
                <label htmlFor="groomer-contact-message" className="block text-xs font-bold text-text mb-1">Message *</label>
                <textarea
                    id="groomer-contact-message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="What services are you looking for?"
                />
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 shadow-sm disabled:opacity-70"
            >
                {isPending ? "Sending..." : "Send Message"}
                {!isPending && <PaperPlaneRight weight="bold" className="w-4 h-4" />}
            </button>
        </form>
    );
}
