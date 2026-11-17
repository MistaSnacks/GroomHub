import Image from "next/image";

const VERSION = "?v=maui-20260904-alpha1";
const art = (file: string, alt: string) => ({ src: `/maui-assets/${file}.png${VERSION}`, alt });

/** Every pose here shows four limbs or fewer. Count the limbs at zoom before you add a pose. */
const MAUI = {
  hi: art("00-maui-main", "Maui waving hello"),
  bath: art("01-maui-bath", "Maui in a bubble bath"),
  nailTable: art("04-maui-nail-trim-table", "Maui on a grooming table for a nail trim"),
  brush: art("05-maui-sitting-pretty", "Maui getting brushed"),
  towel: art("06-maui-towel-head-standing", "Maui with a towel on his head"),
  blowDry: art("07-maui-blow-dry", "Maui getting a blow dry"),
  ball: art("08-maui-playing-ball", "Maui playing with a ball"),
  cat: art("09-maui-cat-costume", "Maui in a cat costume"),
  bubbles: art("10-maui-bath-alt", "Maui in a tub with bubbles on his head"),
  brushAlt: art("14-maui-sitting-pretty-alt", "Maui sitting still for a brush"),
  hearts: art("16-maui-towel-head-hearts", "Maui in a towel with hearts around him"),
  ballAlt: art("17-maui-playing-ball-alt", "Maui in a play bow with a ball"),
  freshBath: art("18-maui-fresh-bath-waving", "Maui waving after a bath"),
  heartsAlt: art("19-maui-towel-head-hearts-new", "Maui fresh from the bath"),
  blanket: art("maui-anxious-dog-grooming-blog", "Maui wrapped in a soft blanket"),
  catHoodie: art("maui-cat-grooming-blog", "Maui in a cat hoodie"),
  magnifier: art("maui-choosing-groomer-blog", "Maui looking through a magnifying glass"),
  doodle: art("maui-goldendoodle-grooming-guide-blog", "Maui leaping with a brush"),
  apron: art("maui-groomer-apron-signature", "Maui in a groomer apron with scissors and a dryer"),
  piggyBank: art("maui-grooming-cost-blog", "Maui next to a piggy bank"),
  calendar: art("maui-grooming-frequency-blog", "Maui next to a calendar"),
  van: art("maui-grooming-van-cost-chibi", "Maui waving next to a grooming van"),
  dolly: art("maui-halloween-dolly-tribute-blog", "Maui in curls and a pink hat"),
  shedFur: art("maui-matted-dog-grooming-blog", "Maui next to a pile of brushed-out fur"),
  seasons: art("maui-pnw-seasonal-blog", "Maui with leaves, sun and a snowflake"),
  ribbon: art("maui-puppy-first-groom-blog", "Maui with a gold ribbon"),
  senior: art("maui-senior-dog-grooming-blog", "Maui in glasses and a cardigan"),
} as const;

export const BAND_MAUI = {
  dog: MAUI.towel,
  cat: MAUI.cat,
  mobile: MAUI.freshBath,
  services: MAUI.brush,
  specialties: MAUI.ribbon,
  guides: MAUI.calendar,
  search: MAUI.magnifier,
  quotes: MAUI.heartsAlt,
  groomers: MAUI.apron,
  pricing: MAUI.piggyBank,
  hi: MAUI.hi,
} as const;

export type BandMauiPose = keyof typeof BAND_MAUI;
type MauiArt = { src: string; alt: string };

const SERVICE_MAUI: Record<string, MauiArt> = {
  "full-groom": MAUI.apron,
  "cat-grooming": MAUI.cat,
  "nail-care": MAUI.nailTable,
  "dog-bath": MAUI.bath,
  "mobile-grooming": MAUI.van,
  "self-wash": MAUI.bubbles,
  "teeth-cleaning": MAUI.hi,
  deshedding: MAUI.shedFur,
  "ear-cleaning": MAUI.towel,
  "puppy-grooming": MAUI.ribbon,
  "flea-treatment": MAUI.freshBath,
  "hand-stripping": MAUI.brushAlt,
  "creative-grooming": MAUI.dolly,
  boarding: MAUI.blanket,
  daycare: MAUI.ball,
};

const SPECIALTY_MAUI: Record<string, MauiArt> = {
  "doodle-poodle": MAUI.doodle,
  "puppy-specialist": MAUI.ribbon,
  "fear-free": MAUI.blanket,
  "large-dogs": MAUI.towel,
  "cat-specialist": MAUI.catHoodie,
  "small-dogs": MAUI.ballAlt,
  "senior-pets": MAUI.senior,
  "eco-friendly": MAUI.seasons,
  "double-coat": MAUI.blowDry,
  "matted-coats": MAUI.shedFur,
  "breed-specific-cuts": MAUI.apron,
  "skin-sensitive": MAUI.bath,
  "special-needs": MAUI.hearts,
  "reactive-dogs": MAUI.brushAlt,
  "long-coat": MAUI.brush,
};

/** The Maui that fits one service page. A new service falls back to the brush Maui. */
export function serviceMaui(slug: string): MauiArt {
  return SERVICE_MAUI[slug] ?? BAND_MAUI.services;
}

/** The Maui that fits one specialty page. A new specialty falls back to the ribbon Maui. */
export function specialtyMaui(slug: string): MauiArt {
  return SPECIALTY_MAUI[slug] ?? BAND_MAUI.specialties;
}

const CORNER =
  "bottom-1 right-3 w-[5.5rem] sm:right-6 sm:w-28 lg:bottom-2 lg:right-[max(2%,calc(50%-640px))] lg:w-[clamp(130px,13vw,200px)]";

/**
 * Maui in the bottom right corner of a page band. `pose` names a page family; `art` passes one image.
 * A band with Maui as a direct child gets more bottom room on phones (see `.page-band:has(> .band-maui)`).
 */
export function BandMaui({ pose, art: image, className = CORNER }: { pose?: BandMauiPose; art?: MauiArt; className?: string }) {
  const { src, alt } = image ?? BAND_MAUI[pose ?? "hi"];
  return (
    <div className={`band-maui maui-pop maui-wiggle absolute ${className}`}>
      <Image src={src} alt={alt} width={400} height={400} sizes="(min-width: 1024px) 200px, 112px" className="aspect-square w-full select-none object-contain" />
    </div>
  );
}
