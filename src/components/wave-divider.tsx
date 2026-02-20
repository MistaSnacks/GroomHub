const WAVE_PATHS = {
  gentle:
    "M0,64 C320,128 640,0 960,64 C1280,128 1600,0 1920,64 L1920,200 L0,200 Z",
  steep:
    "M0,100 C240,180 480,20 720,100 C960,180 1200,20 1440,100 C1680,180 1920,20 1920,100 L1920,200 L0,200 Z",
  double:
    "M0,80 C320,160 640,10 960,80 C1280,150 1600,30 1920,80 L1920,200 L0,200 Z",
  asymmetric:
    "M0,120 C480,40 720,160 1200,60 C1500,10 1800,100 1920,80 L1920,200 L0,200 Z",
  footer:
    "M0,40 C320,100 640,0 960,60 C1280,120 1600,20 1920,40 L1920,200 L0,200 Z",
} as const;

type WaveVariant = keyof typeof WAVE_PATHS;

interface WaveDividerProps {
  variant?: WaveVariant;
  fromColor: string;
  toColor: string;
  flip?: boolean;
  height?: number;
  className?: string;
}

export function WaveDivider({
  variant = "gentle",
  fromColor,
  toColor,
  flip = false,
  height = 80,
  className = "",
}: WaveDividerProps) {
  const path = WAVE_PATHS[variant];

  return (
    <div
      className={`w-full overflow-hidden leading-[0] -mb-[1px] ${className}`}
      style={{ height, transform: flip ? "scaleY(-1)" : undefined }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1920 200"
        preserveAspectRatio="none"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background fills entire viewBox with fromColor */}
        <rect width="1920" height="200" fill={fromColor} />
        {/* Wave path fills with toColor */}
        <path d={path} fill={toColor} />
      </svg>
    </div>
  );
}
