"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { MauiMascot } from "./maui-mascot";
import { EnvelopeSimpleOpen, Clock, Storefront, PawPrint } from "@phosphor-icons/react";
import { WaveDivider } from "./wave-divider";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export function ContactContent() {
  return (
    <div className="min-h-screen text-brand-primary overflow-hidden">

      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.p variants={itemVariants} className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
              Get in Touch
            </motion.p>
            <motion.h1 variants={itemVariants} className="font-heading text-5xl md:text-6xl font-bold mb-6 text-brand-primary">
              We&apos;d love to{" "}
              <span className="text-brand-secondary italic">hear from you.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-text-muted">
              Have a question about our directory? Need help claiming a business profile? We&apos;re here to help.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Contact Form + Info Cards */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            {/* Contact Form */}
            <motion.div variants={itemVariants} className="lg:col-span-3 bg-white rounded-2xl border border-border p-6 md:p-8">
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-6">
                Send us a message
              </h2>
              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-1.5">First name</label>
                    <input type="text" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="Your first name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-1.5">Last name</label>
                    <input type="text" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="Your last name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1.5">Email</label>
                  <input type="email" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1.5">Subject</label>
                  <input type="text" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="What can we help with?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1.5">Message</label>
                  <textarea rows={5} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent resize-none" placeholder="Tell us more..." />
                </div>
                <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-primary/90 transition-colors">
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Info Cards */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              {/* Email */}
              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/10 text-brand-accent">
                    <EnvelopeSimpleOpen weight="fill" className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-primary">Email Us</h3>
                </div>
                <a href="mailto:hello@groomlocal.com" className="text-sm text-brand-accent hover:underline">
                  hello@groomlocal.com
                </a>
              </div>

              {/* Response Time */}
              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-secondary/15 text-brand-secondary">
                    <Clock weight="fill" className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-primary">Response Time</h3>
                </div>
                <p className="text-sm text-text-muted">We typically respond within 24 hours on business days.</p>
              </div>

              {/* Are you a groomer? */}
              <div className="bg-brand-secondary rounded-2xl p-5 text-slate-900">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                    <Storefront weight="fill" className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold">Are you a groomer?</h3>
                </div>
                <p className="text-sm text-slate-700 mb-3">Claim your free listing and start connecting with local pet parents.</p>
                <Link href="/for-groomers" className="inline-flex items-center px-4 py-2 rounded-full bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors">
                  Learn More
                </Link>
              </div>

              {/* Maui fun fact */}
              <div className="bg-brand-accent/10 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/15 text-brand-accent">
                    <PawPrint weight="fill" className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-primary">Fun Fact</h3>
                </div>
                <p className="text-sm text-text-muted">
                  Maui, our mascot, was named after his favorite grooming style &mdash; a fresh tropical trim that makes his tail wag extra hard!
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
