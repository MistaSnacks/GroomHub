import { getMetroTier } from "./city-pricing";

export const GUIDE_SLUGS = [
  "dog-grooming-cost-seattle-portland-2026",
  "mobile-dog-grooming-cost-guide",
  "dog-nail-trimming-cost-guide",
  "how-much-to-tip-dog-groomer",
  "puppy-first-grooming-guide",
  "goldendoodle-grooming-guide",
  "severely-matted-dog-grooming-guide",
  "grooming-anxious-dogs-stress-free-guide",
  "senior-dog-grooming-budget-guide",
  "dog-grooming-for-shedding",
  "cat-grooming-what-to-expect",
  "dog-ear-cleaning-grooming-guide",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

/** Marks where the anchor goes inside `GuideLink.sentence`. */
export const LINK_TOKEN = "{link}";

export interface GuideLink {
  slug: GuideSlug;
  anchor: string;
  sentence: string;
}

export type LinkContext =
  | { kind: "home" }
  | { kind: "city"; state: string; citySlug: string; cityName: string; hasMobile: boolean }
  | { kind: "groomer"; state: string; citySlug: string; cityName: string; isMobile: boolean }
  | { kind: "service"; slug: string }
  | { kind: "specialty"; slug: string }
  | { kind: "mobile-hub" };

const COST = "dog-grooming-cost-seattle-portland-2026";
const MOBILE = "mobile-dog-grooming-cost-guide";

function guide(slug: GuideSlug, anchor: string, sentence: string): GuideLink {
  return { slug, anchor, sentence };
}

const MOBILE_COST_ANCHOR = "mobile dog grooming cost";

const HOME_LINKS: readonly GuideLink[] = [
  guide(COST, "what a dog groom costs in Washington and Oregon", `Read ${LINK_TOKEN}.`),
  guide(MOBILE, MOBILE_COST_ANCHOR, `Read ${LINK_TOKEN}.`),
  guide("dog-nail-trimming-cost-guide", "dog nail trimming cost", `Read ${LINK_TOKEN}.`),
  guide("how-much-to-tip-dog-groomer", "how much to tip a dog groomer", `Read ${LINK_TOKEN}.`),
];

const SERVICE_LINKS: Readonly<Record<string, readonly GuideLink[]>> = {
  "mobile-grooming": [
    guide(MOBILE, MOBILE_COST_ANCHOR, `See our guide to ${LINK_TOKEN} for typical prices and what drives them.`),
  ],
  "dog-bath": [
    guide(COST, "dog bath prices in Seattle and Portland", `See typical bath prices in our guide to ${LINK_TOKEN}.`),
    guide(MOBILE, "mobile dog wash prices", `Prefer a bath at your door? See ${LINK_TOKEN}.`),
  ],
  "self-wash": [
    guide(COST, "dog bath prices in Seattle and Portland", `To compare with a groomer's bath, see ${LINK_TOKEN}.`),
  ],
  "nail-care": [
    guide("dog-nail-trimming-cost-guide", "dog nail trimming cost", `See our guide to ${LINK_TOKEN} for typical prices.`),
  ],
  "full-groom": [
    guide(COST, "dog grooming costs in Seattle and Portland", `For typical full groom prices, see our guide to ${LINK_TOKEN}.`),
  ],
  deshedding: [
    guide(COST, "how much dog grooming costs", `For a sense of what a groom costs in the region, see ${LINK_TOKEN}.`),
  ],
  "teeth-cleaning": [
    guide(COST, "grooming add-on prices", `Add-ons are priced on top of the groom. See ${LINK_TOKEN} for typical amounts.`),
  ],
  "flea-treatment": [
    guide(COST, "grooming add-on prices", `Add-ons are priced on top of the groom. See ${LINK_TOKEN} for typical amounts.`),
  ],
  "ear-cleaning": [
    guide(COST, "grooming add-on prices", `Add-ons are priced on top of the groom. See ${LINK_TOKEN} for typical amounts.`),
    guide("dog-ear-cleaning-grooming-guide", "dog ear cleaning guide", `To care for your dog's ears between visits, read our ${LINK_TOKEN}.`),
  ],
  "puppy-grooming": [
    guide("puppy-first-grooming-guide", "puppy first grooming guide", `New puppy? Read our ${LINK_TOKEN} before the first visit.`),
  ],
  "cat-grooming": [
    guide("cat-grooming-what-to-expect", "what to expect at a cat grooming appointment", `First time with a cat? Read ${LINK_TOKEN}.`),
  ],
};

const SPECIALTY_LINKS: Readonly<Record<string, readonly GuideLink[]>> = {
  "doodle-poodle": [
    guide("goldendoodle-grooming-guide", "Goldendoodle grooming guide", `To learn how to care for a doodle coat, read our ${LINK_TOKEN}.`),
  ],
  "matted-coats": [
    guide("severely-matted-dog-grooming-guide", "severely matted dog grooming guide", `If your dog is already matted, read our ${LINK_TOKEN}.`),
  ],
  "fear-free": [
    guide("grooming-anxious-dogs-stress-free-guide", "grooming anxious dogs", `For ways to keep a visit calm, see our guide to ${LINK_TOKEN}.`),
  ],
  "reactive-dogs": [
    guide("grooming-anxious-dogs-stress-free-guide", "grooming anxious dogs", `For ways to lower stress at the salon, see our guide to ${LINK_TOKEN}.`),
  ],
  "special-needs": [
    guide("grooming-anxious-dogs-stress-free-guide", "grooming anxious dogs", `For tips that make grooming easier on a nervous dog, see our guide to ${LINK_TOKEN}.`),
  ],
  "senior-pets": [
    guide("senior-dog-grooming-budget-guide", "senior dog grooming on a budget", `Planning for an older dog? See our guide to ${LINK_TOKEN}.`),
  ],
  "puppy-specialist": [
    guide("puppy-first-grooming-guide", "puppy first grooming guide", `New puppy? Read our ${LINK_TOKEN} before the first visit.`),
  ],
  "double-coat": [
    guide("dog-grooming-for-shedding", "dog grooming for shedding", `To keep shedding under control, read our guide to ${LINK_TOKEN}.`),
  ],
  "long-coat": [
    guide("dog-grooming-for-shedding", "dog grooming for shedding", `To keep a long coat and shedding under control, read our guide to ${LINK_TOKEN}.`),
  ],
  "cat-specialist": [
    guide("cat-grooming-what-to-expect", "what to expect at a cat grooming appointment", `First time with a cat? Read ${LINK_TOKEN}.`),
  ],
  "small-dogs": [
    guide(COST, "what small dogs cost to groom", `For typical prices by dog size, see ${LINK_TOKEN}.`),
  ],
  "large-dogs": [
    guide(COST, "what large dogs cost to groom", `For typical prices by dog size, see ${LINK_TOKEN}.`),
  ],
};

function cityMetro(state: string, cityName: string): "seattle" | "portland" | null {
  const tier = getMetroTier(cityName);
  if (tier === "seattle" && state === "WA") return "seattle";
  if (tier === "portland" && state === "OR") return "portland";
  return null;
}

function costAnchor(state: string, cityName: string): string {
  const metro = cityMetro(state, cityName);
  if (metro === "seattle") return "Seattle dog grooming prices";
  if (metro === "portland") return "Portland dog grooming prices";
  return "what a dog groom costs in Washington and Oregon";
}

function linksFor(ctx: LinkContext): readonly GuideLink[] {
  switch (ctx.kind) {
    case "home":
      return HOME_LINKS;
    case "city": {
      const links = [
        guide(COST, costAnchor(ctx.state, ctx.cityName), `For a closer look at prices, read our guide to ${LINK_TOKEN}.`),
      ];
      if (ctx.hasMobile) {
        links.push(guide(MOBILE, MOBILE_COST_ANCHOR, `Thinking about a groomer who comes to you? Read our guide to ${LINK_TOKEN}.`));
      }
      return links;
    }
    case "groomer": {
      if (ctx.isMobile) {
        return [guide(MOBILE, MOBILE_COST_ANCHOR, `Curious how mobile grooming prices compare? See our guide to ${LINK_TOKEN}.`)];
      }
      if (cityMetro(ctx.state, ctx.cityName)) {
        return [guide(COST, costAnchor(ctx.state, ctx.cityName), `To compare prices, see our guide to ${LINK_TOKEN}.`)];
      }
      return [];
    }
    case "service":
      return SERVICE_LINKS[ctx.slug] ?? [];
    case "specialty":
      return SPECIALTY_LINKS[ctx.slug] ?? [];
    case "mobile-hub":
      return [guide(MOBILE, MOBILE_COST_ANCHOR, `Wondering what mobile grooming costs? Read our guide to ${LINK_TOKEN}.`)];
  }
}

/** Guide links for a page, limited to posts that are live so no template link can 404. */
export function guideLinksFor(ctx: LinkContext, published: ReadonlySet<string>): GuideLink[] {
  return linksFor(ctx).filter((link) => published.has(link.slug));
}
