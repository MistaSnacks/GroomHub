"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const ANIMATION_VARIANTS: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  },
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  slideRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
};

/** Child variant for use inside stagger parent */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

type AnimationVariant = "fadeUp" | "fadeIn" | "stagger" | "slideLeft" | "slideRight";

interface AnimatedSectionProps {
  variant?: AnimationVariant;
  delay?: number;
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "ul";
}

export function AnimatedSection({
  variant = "fadeUp",
  delay = 0,
  className = "",
  children,
  as = "div",
}: AnimatedSectionProps) {
  const Component = as === "section" ? motion.section : as === "ul" ? motion.ul : motion.div;

  return (
    <Component
      variants={ANIMATION_VARIANTS[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={delay ? { delay } : undefined}
      className={className}
    >
      {children}
    </Component>
  );
}

/** Wrap individual items inside a stagger AnimatedSection */
export function AnimatedItem({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}
