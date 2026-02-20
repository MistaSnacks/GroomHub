"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface MauiMascotProps {
  size?: number;
  className?: string;
  src?: string;
  animation?: "bounce" | "float" | "none" | "sayingHi"; // sayingHi kept for backward compatibility
  interactive?: boolean;
}

export function MauiMascot({
  size = 128,
  className,
  src = "/maui-assets/00-maui-main.png",
  animation = "float",
  interactive = true,
}: MauiMascotProps) {

  const getAnimationProps = () => {
    if (animation === "float" || animation === "sayingHi") {
      return {
        animate: { y: [0, -10, 0] },
        transition: { repeat: Infinity, duration: 4, ease: "easeInOut" as const }
      };
    }
    if (animation === "bounce") {
      return {
        animate: { y: [0, -20, 0] },
        transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const }
      };
    }
    return {};
  };

  return (
    <motion.div
      className={`inline-flex items-end justify-center select-none ${className ?? ""}`}
      aria-label="Maui the mascot"
      style={{ width: size, height: size }}
      {...getAnimationProps()}
      whileHover={interactive ? { scale: 1.05, rotate: [-2, 2, -2, 0] } : undefined}
    >
      <Image
        src={src}
        alt="Maui Mascot"
        width={size}
        height={size}
        className="w-full h-full object-contain drop-shadow-md"
        priority
      />
    </motion.div>
  );
}
