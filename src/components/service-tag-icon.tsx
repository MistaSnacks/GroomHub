import {
  Scissors,
  Cat,
  Drop,
  Van,
  Bathtub,
  Tooth,
  Dog,
  Ear,
  Bug,
  HandGrabbing,
  Palette,
  House,
  Sun,
  PawPrint,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

interface ServiceTagIconProps {
  slug: string;
  className?: string;
}

export function ServiceTagIcon({ slug, className = "w-6 h-6" }: ServiceTagIconProps) {
  const iconMap: Record<string, React.ReactNode> = {
    "full-groom": <Scissors weight="duotone" className={className} />,
    "cat-grooming": <Cat weight="duotone" className={className} />,
    "nail-care": <PawPrint weight="duotone" className={className} />,
    "dog-bath": <Bathtub weight="duotone" className={className} />,
    "mobile-grooming": <Van weight="duotone" className={className} />,
    "self-wash": <Drop weight="duotone" className={className} />,
    "teeth-cleaning": <Tooth weight="duotone" className={className} />,
    deshedding: <Dog weight="duotone" className={className} />,
    "ear-cleaning": <Ear weight="duotone" className={className} />,
    "puppy-grooming": <Sparkle weight="duotone" className={className} />,
    "flea-treatment": <Bug weight="duotone" className={className} />,
    "hand-stripping": <HandGrabbing weight="duotone" className={className} />,
    "creative-grooming": <Palette weight="duotone" className={className} />,
    boarding: <House weight="duotone" className={className} />,
    daycare: <Sun weight="duotone" className={className} />,
  };
  return <>{iconMap[slug] ?? <PawPrint weight="duotone" className={className} />}</>;
}
