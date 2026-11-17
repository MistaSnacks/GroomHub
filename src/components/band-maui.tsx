import Image from "next/image";

const VERSION = "?v=maui-20260904-alpha1";

export const BAND_MAUI = {
  dog: { src: `/maui-assets/06-maui-towel-head-standing.png${VERSION}`, alt: "Maui with a towel on his head" },
  cat: { src: `/maui-assets/09-maui-cat-costume.png${VERSION}`, alt: "Maui in a cat costume" },
  mobile: { src: `/maui-assets/18-maui-fresh-bath-waving.png${VERSION}`, alt: "Maui waving after a bath" },
  services: { src: `/maui-assets/03-maui-nail-clip.png${VERSION}`, alt: "Maui getting a nail trim" },
  specialties: { src: `/maui-assets/02-maui-ear-cleaning.png${VERSION}`, alt: "Maui getting his ears cleaned" },
  guides: { src: `/maui-assets/05-maui-sitting-pretty.png${VERSION}`, alt: "Maui sitting" },
} as const;

export type BandMauiPose = keyof typeof BAND_MAUI;

/** Maui at the right of an inner page band. Hidden below 1024px, where the band is a cream page. */
export function BandMaui({ pose, className = "bottom-2 right-[max(2%,calc(50%-640px))] w-[clamp(130px,13vw,200px)]" }: { pose: BandMauiPose; className?: string }) {
  const { src, alt } = BAND_MAUI[pose];
  return (
    <div className={`maui-pop maui-wiggle absolute hidden lg:block ${className}`}>
      <Image src={src} alt={alt} width={400} height={400} sizes="200px" className="aspect-square w-full select-none object-contain" />
    </div>
  );
}
