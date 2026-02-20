interface DecorativePawsProps {
  variant?: "scattered" | "corner";
  color?: string;
  className?: string;
}

function PawSvg({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main pad */}
      <ellipse cx="32" cy="40" rx="14" ry="12" />
      {/* Top left toe */}
      <ellipse cx="16" cy="22" rx="7" ry="9" transform="rotate(-15 16 22)" />
      {/* Top right toe */}
      <ellipse cx="48" cy="22" rx="7" ry="9" transform="rotate(15 48 22)" />
      {/* Inner left toe */}
      <ellipse cx="24" cy="16" rx="6" ry="8" transform="rotate(-5 24 16)" />
      {/* Inner right toe */}
      <ellipse cx="40" cy="16" rx="6" ry="8" transform="rotate(5 40 16)" />
    </svg>
  );
}

export function DecorativePaws({
  variant = "scattered",
  color = "currentColor",
  className = "",
}: DecorativePawsProps) {
  if (variant === "corner") {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
        style={{ color }}
        aria-hidden="true"
      >
        <PawSvg className="absolute -top-4 -right-4 w-32 h-32 opacity-[0.04] rotate-[-20deg]" />
        <PawSvg className="absolute -bottom-6 -left-6 w-40 h-40 opacity-[0.03] rotate-[15deg]" />
      </div>
    );
  }

  // scattered
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ color }}
      aria-hidden="true"
    >
      <PawSvg className="absolute top-[8%] left-[5%] w-20 h-20 opacity-[0.04] rotate-[-25deg]" />
      <PawSvg className="absolute top-[15%] right-[10%] w-16 h-16 opacity-[0.03] rotate-[30deg]" />
      <PawSvg className="absolute bottom-[20%] left-[60%] w-24 h-24 opacity-[0.04] rotate-[-10deg]" />
      <PawSvg className="absolute bottom-[10%] right-[5%] w-14 h-14 opacity-[0.03] rotate-[45deg]" />
    </div>
  );
}
