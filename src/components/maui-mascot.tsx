import Image from "next/image";

interface MauiMascotProps {
  size?: number;
  className?: string;
  src?: string;
  alt?: string;
  /** Maui wiggles once when the pointer is on him. */
  interactive?: boolean;
  priority?: boolean;
}

export function MauiMascot({
  size = 128,
  className,
  src = "/maui-assets/00-maui-main.png?v=maui-20260904-alpha1",
  alt = "Maui Mascot",
  interactive = true,
  priority = false,
}: MauiMascotProps) {
  return (
    <div
      className={`inline-flex items-end justify-center select-none ${interactive ? "maui-wiggle" : ""} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-contain drop-shadow-md"
        priority={priority}
      />
    </div>
  );
}
