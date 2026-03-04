"use client";

import { motion, Variants } from "framer-motion";
import { MauiMascot } from "./maui-mascot";
import { Heart, Star, Leaf, Users } from "@phosphor-icons/react";
import { WaveDivider } from "./wave-divider";

interface AboutContentProps {
  metrics: {
    totalGroomers: number;
    citiesCovered: number;
    statesCovered: number;
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
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

export function AboutContent({ metrics }: AboutContentProps) {
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
              Our Story
            </motion.p>
            <motion.h1 variants={itemVariants} className="font-heading text-5xl md:text-6xl font-bold mb-6 text-brand-primary">
              Built by pet parents,{" "}
              <span className="text-brand-secondary italic">for pet parents.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-text-muted">
              We started GroomLocal with a simple mission: make finding a great groomer in the Pacific Northwest as easy as a belly rub.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Story + Stats */}
      <section className="py-20 md:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="flex flex-col md:flex-row items-center gap-12 md:gap-20"
          >
            <motion.div variants={itemVariants} className="w-full md:w-2/5 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-3xl -z-10" />
                <MauiMascot src="/maui-assets/08-maui-playing-ball.png" size={320} animation="float" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="w-full md:w-3/5">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 text-brand-primary">
                It started with a bad haircut.
              </h2>
              <p className="text-text-muted text-lg leading-relaxed mb-4">
                After one too many mismatched grooming experiences, we realized the PNW needed a better way to find and compare pet groomers. Not another generic directory &mdash; a curated, pet-first resource built by people who actually care.
              </p>
              <p className="text-text-muted text-lg leading-relaxed mb-8">
                Today, GroomLocal helps thousands of pet parents across Washington and Oregon discover verified groomers who truly love what they do.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">
                    {metrics.totalGroomers.toLocaleString()}+
                  </p>
                  <p className="text-sm text-text-muted">Groomers Listed</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">
                    {metrics.citiesCovered.toLocaleString()}
                  </p>
                  <p className="text-sm text-text-muted">Cities Covered</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">
                    {metrics.statesCovered}
                  </p>
                  <p className="text-sm text-text-muted">States</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* Values — Bento Grid */}
      <section className="py-20 md:py-28 bg-bg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
              What We Believe
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">
              Our Values
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Large card — spans 2 rows */}
            <motion.div variants={itemVariants} className="md:row-span-2 bg-white rounded-2xl border border-border p-8 flex flex-col">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-brand-secondary/15 text-brand-secondary mb-6">
                <Heart weight="fill" className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-brand-primary mb-3">Pets First</h3>
              <p className="text-text-muted leading-relaxed flex-1">
                Every decision we make starts with one question: is this better for pets? We verify groomers, highlight fear-free options, and make sure your furry family member is always the priority.
              </p>
            </motion.div>

            {/* Transparency */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-border p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent mb-4">
                <Star weight="fill" className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-primary mb-2">Transparency</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Real reviews, verified listings, and honest pricing. No hidden surprises.
              </p>
            </motion.div>

            {/* Free Forever — teal bg */}
            <motion.div variants={itemVariants} className="bg-brand-accent text-white rounded-2xl p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4">
                <Leaf weight="fill" className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">Free Forever</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Searching for a groomer should never cost a thing. Our directory is free for pet parents, always.
              </p>
            </motion.div>

            {/* Community — cream bg */}
            <motion.div variants={itemVariants} className="md:col-span-2 bg-brand-secondary/10 rounded-2xl p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary mb-4">
                <Users weight="fill" className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-primary mb-2">Community</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                We support local PNW businesses and connect them with loving pet parents. Every groomer in our directory is part of the family.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Meet Maui */}
      <section className="py-20 md:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="flex flex-col md:flex-row items-center gap-12 md:gap-20"
          >
            <motion.div variants={itemVariants} className="w-full md:w-1/2">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
                Our Mascot
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Meet <span className="text-brand-accent">Maui</span>
              </h2>
              <p className="text-text-muted text-lg mb-6 leading-relaxed">
                Maui is our small, fluffy, and endlessly enthusiastic Chief Grooming Officer! With his signature red bandana and happy tail wags, he&apos;s here to guide you through finding the best grooming services for your furry family members.
              </p>
              <p className="text-text-muted text-lg leading-relaxed">
                Whether he&apos;s testing out a new bubble bath or giving the paw of approval to a fresh haircut, Maui ensures every groomer in our directory meets our high standards.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="w-full md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-secondary/20 rounded-full blur-3xl -z-10" />
                <MauiMascot src="/maui-assets/05-maui-sitting-pretty.png" size={320} animation="bounce" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
