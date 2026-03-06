/**
 * City-specific content for enhanced location pages.
 * Neighborhoods, dog parks, and dog-friendly attractions
 * sourced from official city parks departments, tourism boards,
 * and local guides. Data keyed by "STATE:city_slug".
 */

export interface DogPark {
  name: string;
  description: string;
  offLeash: boolean;
  features?: string[];
}

export interface DogFriendlySpot {
  name: string;
  description: string;
  type: "restaurant" | "brewery" | "trail" | "beach" | "store" | "indoor-park" | "attraction";
}

export interface Neighborhood {
  name: string;
  description: string;
}

export interface CityContent {
  intro: string;
  neighborhoods: Neighborhood[];
  dogParks: DogPark[];
  dogFriendlySpots: DogFriendlySpot[];
}

const CITY_CONTENT: Record<string, CityContent> = {
  "WA:seattle": {
    intro:
      "Seattle is one of the most dog-friendly cities in the Pacific Northwest, with over 30 off-leash parks, hundreds of dog-welcoming patios, and a culture that treats pups like family. Sound Transit allows dogs of all sizes on its services, making it easy to get around town with your four-legged friend.",
    neighborhoods: [
      { name: "Ballard", description: "Formerly industrial waterfront neighborhood packed with dog-friendly breweries, restaurants, and scenic walks along the Ballard Locks and Sunset Hill Park." },
      { name: "Capitol Hill", description: "Vibrant, walkable neighborhood with Volunteer Park and a thriving cafe scene that welcomes dogs on patios year-round." },
      { name: "Green Lake", description: "A 2.8-mile loop trail around Green Lake draws dog walkers daily, with a dedicated off-leash area on the northeast shore." },
      { name: "West Seattle", description: "Beach-town vibe with Alki Beach, Lincoln Park trails, and a tight-knit community of dog owners and local groomers." },
      { name: "Fremont", description: "Quirky, artsy neighborhood known as the \"Center of the Universe\" with dog-friendly shops along the Burke-Gilman Trail." },
      { name: "Magnolia", description: "Quiet, residential neighborhood home to Discovery Park — 534 acres of trails, meadows, and beach access for leashed walks." },
    ],
    dogParks: [
      { name: "Magnuson Park Off-Leash Area", description: "Seattle's largest off-leash park at 9 acres in Sand Point, featuring open fields, wooded trails, and waterfront access on Lake Washington.", offLeash: true, features: ["waterfront", "large area", "wooded trails"] },
      { name: "Golden Gardens Off-Leash Area", description: "Beachfront off-leash area in Ballard combining sandy shoreline with scenic trails and Puget Sound views.", offLeash: true, features: ["beach access", "scenic views"] },
      { name: "Woodland Park Off-Leash Area", description: "Fully fenced off-leash space in the Phinney Ridge neighborhood, popular with neighborhood regulars.", offLeash: true, features: ["fully fenced", "community vibe"] },
      { name: "Westcrest Park Off-Leash Area", description: "Highland Park's hidden gem with 4 acres of wooded trails and a separate small-dog section.", offLeash: true, features: ["wooded trails", "small dog area"] },
      { name: "Blue Dog Pond", description: "1.7-acre neighborhood off-leash area next to Judkins Park with unique art installations and friendly regulars.", offLeash: true, features: ["art installations", "neighborhood park"] },
      { name: "Denny Substation Dog Park", description: "Capitol Hill's go-to off-leash park with AstroTurf surface — no mud, even in Seattle's rainy months.", offLeash: true, features: ["AstroTurf", "mud-free"] },
    ],
    dogFriendlySpots: [
      { name: "Norm's Eatery & Ale House", type: "restaurant", description: "Fremont staple with a dog-friendly patio and a loyal following of local dog owners." },
      { name: "Stoup Brewing", type: "brewery", description: "Ballard brewery with a large covered patio where well-behaved dogs are always welcome." },
      { name: "Burke-Gilman Trail", type: "trail", description: "27-mile multi-use trail stretching from Ballard to Bothell — perfect for long walks and runs with your dog." },
      { name: "Alki Beach", type: "beach", description: "West Seattle's iconic waterfront stretch where leashed dogs can enjoy sandy walks with skyline views." },
    ],
  },

  "WA:tacoma": {
    intro:
      "Tacoma is a rising star for dog owners in the South Sound, offering spacious parks, waterfront trails along Commencement Bay, and a growing number of dog-friendly restaurants and breweries. With lower grooming costs than Seattle and a laid-back vibe, Tacoma is a great place to keep your pup pampered.",
    neighborhoods: [
      { name: "Stadium District", description: "Historic neighborhood near Wright Park with walkable streets, local coffee shops, and easy access to downtown grooming salons." },
      { name: "6th Avenue", description: "Tacoma's eclectic dining strip with dog-friendly patios at spots like Engine House No. 9 and the Parkway Tavern." },
      { name: "Proctor District", description: "Family-friendly neighborhood with tree-lined streets, local boutiques, and proximity to Point Defiance Park." },
      { name: "North End", description: "Residential area along the waterfront with Ruston Way trails and access to Point Defiance — Tacoma's crown jewel for dog owners." },
      { name: "South Tacoma", description: "Home to Wapato Park and the Swan Creek trail system, offering affordable neighborhoods with great green space for dogs." },
    ],
    dogParks: [
      { name: "Point Defiance Off-Leash Area", description: "Seven-acre off-leash area south of Fort Nisqually within Tacoma's flagship 760-acre park, featuring shade shelters, a waterfront bluff, and a separate small-dog area.", offLeash: true, features: ["7 acres", "waterfront bluff", "small dog area"] },
      { name: "Wapato Park Dog Park", description: "Fully fenced dog park with three separate areas for pets to roam off-leash, including a dedicated small-dog zone. Water, benches, and shelters provided.", offLeash: true, features: ["fully fenced", "3 areas", "small dog zone"] },
      { name: "Swan Creek Off-Leash Dog Park", description: "Opened in 2021, this 4-acre off-leash area features separate small-dog and large-dog sections, forested trails, and plenty of open space.", offLeash: true, features: ["4 acres", "forested trails", "separate sections"] },
      { name: "Rogers Playfield Off-Leash Area", description: "1.5-acre fully fenced off-leash park with drinking fountains, benches, and shade shelters in a convenient central location.", offLeash: true, features: ["fully fenced", "shade shelters"] },
    ],
    dogFriendlySpots: [
      { name: "Dusty's Hideaway", type: "restaurant", description: "Casual spot with a large backyard patio where dogs are welcome. Known for their \"Pup Patty\" and treats on hand for four-legged guests." },
      { name: "Engine House No. 9", type: "brewery", description: "Historic firehouse turned brewpub in the 6th Ave district with great outdoor space and dog-loving staff who keep water bowls at the ready." },
      { name: "Wet Nose Dry Paws", type: "indoor-park", description: "6,000-square-foot indoor dog park with turf zones, agility equipment, and climate-controlled play — plus beer for the humans." },
      { name: "Ruston Way Waterfront", type: "trail", description: "2-mile paved trail along Commencement Bay connecting multiple parks, restaurants, and waterfront views." },
    ],
  },

  "WA:bellevue": {
    intro:
      "Bellevue welcomes dogs in all 70 of its parks and trails, making the Eastside a fantastic place for dog owners. From the legendary Marymoor Park in nearby Redmond to local off-leash corrals, the Eastside combines urban convenience with Pacific Northwest greenery.",
    neighborhoods: [
      { name: "Downtown Bellevue", description: "Urban core with dog-friendly restaurant patios along Bellevue Way and easy access to Bellevue Downtown Park's paths." },
      { name: "Crossroads", description: "Diverse, walkable neighborhood with its own off-leash dog park at Crossroads Community Park." },
      { name: "Wilburton", description: "Central neighborhood with the Wilburton Hill off-leash area and proximity to the Eastside Rail Corridor trail." },
      { name: "Factoria", description: "Residential area near Mercer Slough Nature Park — 320 acres of wetland trails where leashed dogs can explore." },
    ],
    dogParks: [
      { name: "Marymoor Off-Leash Dog Park", description: "Known as the \"Disneyland for Dogs,\" this 40-acre off-leash area in nearby Redmond features open fields, swimming access, and agility equipment.", offLeash: true, features: ["40 acres", "swimming", "agility equipment"] },
      { name: "Robinswood Off-Leash Dog Corral", description: "Bellevue's dedicated off-leash facility within Robinswood Community Park, with a fully fenced area for safe play.", offLeash: true, features: ["fully fenced", "community park"] },
      { name: "Crossroads Off-Leash Area", description: "Neighborhood off-leash park being upgraded to a permanent facility, popular with local dog owners.", offLeash: true, features: ["neighborhood park"] },
      { name: "Luther Burbank Off-Leash Area", description: "Located on Mercer Island, this park offers a designated off-leash area and a dog beach on Lake Washington.", offLeash: true, features: ["dog beach", "lake access"] },
    ],
    dogFriendlySpots: [
      { name: "Eastside Rail Corridor Trail", type: "trail", description: "Multi-mile paved trail connecting Bellevue to Kirkland and Redmond — great for long leashed walks." },
      { name: "Mercer Slough Nature Park", type: "trail", description: "320 acres of wetland trails and boardwalks in central Bellevue. Leashed dogs welcome on all paths." },
    ],
  },

  "OR:portland": {
    intro:
      "Ranked the 4th most dog-friendly city in America, Portland boasts over 400 dog-welcoming restaurants, more than 30 off-leash areas, and over 10,000 acres of parks and natural areas. Portland's culture doesn't just tolerate dogs — it celebrates them.",
    neighborhoods: [
      { name: "Southeast Portland", description: "Hawthorne, Division, and Belmont streets are lined with dog-friendly cafes, bars, and boutiques. Mt. Tabor Park is the crown jewel." },
      { name: "Northeast Portland", description: "Alberta Arts District and Irvington offer walkable streets, local dog-friendly eateries, and Fernhill Park's off-leash area." },
      { name: "Northwest Portland / Nob Hill", description: "Upscale neighborhood along NW 23rd Ave with dog-friendly shops and Forest Park — the largest urban forest in the U.S." },
      { name: "Sellwood-Moreland", description: "Antique Row meets dog paradise with Sellwood Riverfront Park's off-leash area right along the Willamette River." },
      { name: "St. Johns", description: "Charming neighborhood with Cathedral Park under the St. Johns Bridge and the pier along the Willamette for scenic leashed walks." },
    ],
    dogParks: [
      { name: "Mt. Tabor Dog Park", description: "Breathtaking hilltop views and wide open spaces with two designated off-leash sections, including one specifically for small dogs.", offLeash: true, features: ["hilltop views", "small dog area", "2 sections"] },
      { name: "Normandale Dog Park", description: "Community favorite with separate fenced sections for large and small dogs, benches, waste stations, and regular community events.", offLeash: true, features: ["fully fenced", "separate sections", "community events"] },
      { name: "Gabriel Park Off-Leash Area", description: "Southwest Portland park with separate large and small breed sections and water fountains designed specifically for dogs.", offLeash: true, features: ["breed sections", "dog fountains"] },
      { name: "Sellwood Riverfront Off-Leash Area", description: "1.5-acre off-leash area along the Willamette River — great for dogs who love water.", offLeash: true, features: ["1.5 acres", "river access"] },
      { name: "Wallace Dog Park", description: "Vast open spaces with water fountains, shaded sections, a fenced off-leash play area with rubberized surface, and a ramp entrance.", offLeash: true, features: ["rubberized surface", "shaded", "accessible ramp"] },
    ],
    dogFriendlySpots: [
      { name: "Lucky Labrador Brew Pub", type: "brewery", description: "Portland institution where pups relax on the patio while humans enjoy barley flour pizza and Black Lab Stout." },
      { name: "Cycle Dog Tavern", type: "brewery", description: "Indoor/outdoor dog park and bar rolled into one — bring your dog to play while you enjoy craft beer and wine." },
      { name: "Forest Park", type: "trail", description: "Over 80 miles of trails in the largest urban forest in the United States. Leashed dogs welcome on all trails." },
      { name: "Tryon Creek State Natural Area", type: "trail", description: "Oregon's only state park within a major metro area, offering 8 miles of wooded ravine trails. Dogs welcome on leash." },
    ],
  },

  "WA:vancouver": {
    intro:
      "Vancouver, Washington combines small-city charm with big outdoor access for dogs. Situated along the Columbia River with easy access to Portland's amenities, Vancouver offers spacious off-leash parks maintained by the DOGPAW community organization and miles of scenic waterfront trails.",
    neighborhoods: [
      { name: "Downtown / Esther Short", description: "Walkable downtown with the Columbia River Renaissance Trail, farmers markets, and dog-friendly brewery patios." },
      { name: "Felida", description: "Suburban neighborhood near Whipple Creek Regional Park — 300 acres of wooded trails that dogs and their owners love." },
      { name: "Salmon Creek", description: "Northern Vancouver neighborhood with easy freeway access and proximity to Salmon Creek Greenway trails." },
      { name: "Mill Plain", description: "Central neighborhood near Dakota Memorial Dog Park, one of the largest off-leash areas in Clark County." },
    ],
    dogParks: [
      { name: "Ike Memorial Dog Park", description: "Vancouver's largest off-leash park at 10 acres, featuring fully fenced area with double-gated entries, gravel and dirt trails, a small-dog area, benches, and dog drinking fountains.", offLeash: true, features: ["10 acres", "small dog area", "double-gated"] },
      { name: "Dakota Memorial Dog Park", description: "Spacious 8-acre off-leash area that is fully fenced with separate small and large dog sections, a gravel loop trail, and a rinse-off station.", offLeash: true, features: ["8 acres", "rinse station", "separate sections"] },
      { name: "Ross Off-Leash Dog Park", description: "DOGPAW-maintained community off-leash area with open fields and a welcoming neighborhood atmosphere.", offLeash: true, features: ["community maintained"] },
    ],
    dogFriendlySpots: [
      { name: "Columbia River Renaissance Trail", type: "trail", description: "5-mile paved trail with stunning Columbia River views, public art, flower beds, water access, and dog-friendly cafes nearby." },
      { name: "Whipple Creek Regional Park", type: "trail", description: "300-acre gem with wide, soft dirt trails under towering firs — a year-round favorite for dog walkers." },
      { name: "Trap Door Brewing", type: "brewery", description: "Lively brewery known for keeping water bowls fresh and greeting dogs with enthusiasm. Dog-friendly patio." },
    ],
  },

  "OR:bend": {
    intro:
      "Bend is an outdoor dog paradise with over 50 miles of urban trails, nine dedicated off-leash parks, more than 40 dog-friendly restaurants, and endless National Forest land right at your doorstep. The city consistently ranks among the most dog-friendly places in Oregon.",
    neighborhoods: [
      { name: "Northwest Crossing", description: "Modern planned community with its own 1.6-acre fenced neighborhood dog park and Discovery Park's 12 acres of open space surrounding a scenic lake." },
      { name: "Old Mill District", description: "Riverfront shopping and dining district along the Deschutes River with paved trails and numerous dog-welcoming patios." },
      { name: "Westside", description: "Residential area with easy access to Phil's Trail system and the Deschutes National Forest for off-leash hiking adventures." },
    ],
    dogParks: [
      { name: "Pine Nursery Park", description: "Bend's largest dog park at 18.8 acres, fully fenced with large grassy areas, juniper-lined trails, and a separate small-dog area.", offLeash: true, features: ["18.8 acres", "fully fenced", "small dog area"] },
      { name: "Riverbend Park Off-Leash Area", description: "Fenced area with riverside access for swimming, picnic shelters, restrooms, and poop bag stations.", offLeash: true, features: ["riverside swimming", "picnic shelters"] },
      { name: "Ponderosa Park", description: "Five fenced acres for dogs to explore with picnic shelters, water sources, and poop bag dispensaries.", offLeash: true, features: ["5 acres", "fully fenced"] },
      { name: "Hollinshead Park", description: "Grassy 3-acre off-leash area with a restored barn and community garden nearby.", offLeash: true, features: ["3 acres", "scenic setting"] },
    ],
    dogFriendlySpots: [
      { name: "10 Barrel Brewing", type: "brewery", description: "Iconic Bend brewery with a spacious outdoor area where dogs are welcomed alongside their owners." },
      { name: "Crux Fermentation Project", type: "brewery", description: "Popular gathering spot with panoramic Cascade Mountain views and a large dog-friendly outdoor area." },
      { name: "Deschutes River Trail", type: "trail", description: "Miles of riverside trails perfect for leashed walks, with swimming access points along the way." },
      { name: "Phil's Trail Complex", type: "trail", description: "Extensive trail network on the west side of town connecting to National Forest land — a dog hiking paradise." },
    ],
  },

  "OR:salem": {
    intro:
      "Oregon's capital city offers surprising dog-friendly value with some of the largest off-leash areas in the Willamette Valley. Minto-Brown Island Park alone provides 30 acres of off-leash space plus miles of scenic trails, all at a fraction of the cost of Portland grooming.",
    neighborhoods: [
      { name: "South Salem", description: "Residential area adjacent to Minto-Brown Island Park — the largest urban park in Oregon and a dog owner's dream." },
      { name: "West Salem", description: "Across the Willamette River with Orchard Heights Park's off-leash run and a growing number of pet-friendly businesses." },
      { name: "Downtown Salem", description: "Walkable core with the Riverfront Park trail along the Willamette and dog-friendly lunch spots." },
    ],
    dogParks: [
      { name: "Minto-Brown Island Off-Leash Area", description: "30-acre dedicated off-leash area within Oregon's largest urban park (1,271 acres), with ample space for dogs to run and miles of adjacent leashed trails.", offLeash: true, features: ["30 acres", "unfenced", "extensive trails"] },
      { name: "Orchard Heights Park", description: "West Salem's fenced dog run plus a large unfenced off-leash field with trails nearby.", offLeash: true, features: ["fenced run", "trails"] },
      { name: "Cascades Gateway Dog Park", description: "Newer addition with separate fenced areas for small and large dogs.", offLeash: true, features: ["separate areas", "fully fenced"] },
    ],
    dogFriendlySpots: [
      { name: "Minto-Brown Island Trails", type: "trail", description: "Miles of scenic trails through wetlands and forest within the massive Minto-Brown Island Park." },
      { name: "Santiam Brewing", type: "brewery", description: "Southeast Salem brewery with a dog-welcoming patio and a laid-back neighborhood atmosphere." },
    ],
  },

  "OR:eugene": {
    intro:
      "Eugene's outdoor lifestyle extends to its four-legged residents, with four major off-leash parks, the Willamette River running through town, and a network of urban trails connecting parks and neighborhoods. The city's laid-back, eco-conscious culture means dogs are welcome almost everywhere.",
    neighborhoods: [
      { name: "South Eugene", description: "Hilly, tree-lined neighborhood near Amazon Dog Park and the Ridgeline Trail system." },
      { name: "Whiteaker", description: "Artsy neighborhood with dog-friendly breweries, food carts, and a walkable community vibe." },
      { name: "River Road", description: "Close to Alton Baker Park and the Willamette River bike path — excellent for daily dog walks." },
    ],
    dogParks: [
      { name: "Amazon Dog Park", description: "Fully fenced enclosure with separate small-dog area, dog drinking water, washing station, indoor restroom, and trail access.", offLeash: true, features: ["fully fenced", "wash station", "small dog area"] },
      { name: "Alton Baker Dog Park", description: "Four acres along the Willamette River with water bowls and large tubs for dogs to play in.", offLeash: true, features: ["4 acres", "river access", "water play"] },
      { name: "Candlelight Dog Park", description: "Double-gated 3.5-acre space with designated large and small dog areas, seating, and a perimeter walking trail.", offLeash: true, features: ["3.5 acres", "double-gated", "separate areas"] },
      { name: "Armitage Dog Park", description: "Two acres of green fields surrounded by trees near the McKenzie River, with picnic shelters and hiking trails.", offLeash: true, features: ["2 acres", "river access", "picnic shelters"] },
    ],
    dogFriendlySpots: [
      { name: "Ridgeline Trail System", type: "trail", description: "12 miles of forested trails along the south hills of Eugene, connecting multiple parks and offering great off-leash-adjacent hiking." },
      { name: "Ninkasi Brewing", type: "brewery", description: "Eugene's iconic craft brewery with a spacious dog-friendly beer garden." },
    ],
  },

  "WA:olympia": {
    intro:
      "Washington's capital city is surprisingly dog-friendly, with a 22-acre off-leash park, waterfront trails along Budd Inlet, and a community that values its green spaces. Olympia's compact size means most neighborhoods are within a short drive of excellent dog parks.",
    neighborhoods: [
      { name: "Downtown Olympia", description: "Walkable capital district with Percival Landing boardwalk, waterfront restaurants, and dog-friendly coffee shops." },
      { name: "Westside", description: "Residential area near Capitol Forest with endless trail options for adventurous dogs and their owners." },
      { name: "Eastside", description: "Close to Ward Lake Dog Park and easy access to I-5 for trips to nearby Lacey parks." },
    ],
    dogParks: [
      { name: "Thurston County Off-Leash Dog Park", description: "22 acres of fenced off-leash open space — one of the largest dog parks in the South Sound region.", offLeash: true, features: ["22 acres", "fenced"] },
      { name: "Ward Lake Dog Park", description: "Local favorite off-leash area near Ward Lake, open daily for dogs of all sizes.", offLeash: true, features: ["all sizes welcome"] },
      { name: "McLane Dog Park", description: "5.5-acre fenced off-leash area near US-101 with double-gated entry and separate small/large dog sections.", offLeash: true, features: ["5.5 acres", "double-gated", "separate sections"] },
    ],
    dogFriendlySpots: [
      { name: "Percival Landing Boardwalk", type: "trail", description: "1.5-mile waterfront boardwalk along Budd Inlet with views of the Capitol dome — perfect for leashed strolls." },
      { name: "Priest Point Park", type: "trail", description: "Expansive wooded trails along the Puget Sound shoreline, welcoming leashed dogs on all paths." },
    ],
  },

  "WA:puyallup": {
    intro:
      "Puyallup offers a family-friendly, affordable alternative to Seattle-area grooming with easy access to Mt. Rainier foothills trails and local parks. The Puyallup River trail system connects neighborhoods for daily dog walks.",
    neighborhoods: [
      { name: "Downtown Puyallup", description: "Charming main street with seasonal farmers markets, antique shops, and local eateries with outdoor seating." },
      { name: "South Hill", description: "Large residential area with multiple community parks and growing pet services." },
    ],
    dogParks: [
      { name: "Dr. Jose Rizal Dog Park", description: "Puyallup's main off-leash area with separate sections for small and large dogs, water stations, and shade.", offLeash: true, features: ["separate sections", "water stations"] },
    ],
    dogFriendlySpots: [
      { name: "Puyallup Riverwalk Trail", type: "trail", description: "Paved trail along the Puyallup River connecting parks and neighborhoods, great for daily leashed walks." },
      { name: "Foothills Trail", type: "trail", description: "Scenic rail-trail heading toward Orting and the foothills of Mt. Rainier — perfect for longer outings." },
    ],
  },
};

/**
 * Get city content by state abbreviation and city slug.
 * Returns null if no enhanced content exists for this city.
 */
export function getCityContent(stateAbbr: string, citySlug: string): CityContent | null {
  const key = `${stateAbbr.toUpperCase()}:${citySlug.toLowerCase()}`;
  return CITY_CONTENT[key] ?? null;
}

/** Get list of city keys that have enhanced content */
export function getEnhancedCitySlugs(): string[] {
  return Object.keys(CITY_CONTENT);
}
