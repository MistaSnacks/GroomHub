// Editorial content for service landing pages
// Each entry provides unique copy to avoid thin/doorway page penalties.

export interface ServiceContent {
  intro: string;
  body: string[];
  tips: string[];
}

export const SERVICE_CONTENT: Record<string, ServiceContent> = {
  "full-groom": {
    intro:
      "A full groom is the most popular grooming service in the Pacific Northwest, covering everything from bath and haircut to nail trimming and ear cleaning in a single appointment.",
    body: [
      "A full groom typically includes a warm bath with breed-appropriate shampoo, a thorough brush-out, a haircut or trim styled to your preference, nail clipping or grinding, ear cleaning, and a sanitary trim. Some groomers also include teeth brushing, cologne, or bandana finishing touches. The entire process usually takes 2 to 4 hours depending on your dog's size, coat condition, and temperament.",
      "This service works well for nearly every dog, but it is especially important for breeds with continuously growing coats like Poodles, Doodles, Shih Tzus, and Bichons. Dogs that spend time hiking PNW trails or playing in the rain benefit from regular full grooms to prevent matting and skin issues caused by damp undercoats.",
      "In Washington and Oregon, expect to pay $50 to $80 for small breeds, $70 to $110 for medium breeds, and $90 to $150 or more for large or heavily coated dogs. Prices vary by location, coat condition, and whether the groomer offers one-on-one attention. Most groomers recommend scheduling a full groom every 4 to 8 weeks.",
    ],
    tips: [
      "Book your appointment 2 to 3 weeks in advance during spring and summer, as PNW groomers fill up fast during shedding season.",
      "Bring reference photos of the cut you want. Clear communication helps your groomer deliver the style you have in mind.",
      "Brush your dog at home between appointments to reduce matting, which can increase the cost and time of a full groom.",
    ],
  },

  "cat-grooming": {
    intro:
      "Cat grooming requires specialized skills and a calm environment. Not every groomer works with cats, so finding one with feline experience matters.",
    body: [
      "Cat grooming services typically include a bath with cat-safe shampoo, blow-dry, nail trimming, ear cleaning, and coat trimming or styling. Popular options include lion cuts (shaving the body while leaving the head and tail fluffy), sanitary trims, and mat removal. Some groomers also offer comb cuts for longhaired breeds.",
      "Cats with medium to long coats, such as Persians, Maine Coons, and Ragdolls, benefit the most from professional grooming. Older cats that have stopped grooming themselves and cats with severe matting also need regular professional attention. The key difference from dog grooming is handling: experienced cat groomers use quiet environments, minimal restraint, and quick techniques to reduce stress.",
      "In the PNW, cat grooming ranges from $60 to $100 for a bath and trim, and $80 to $150 for a full lion cut. Prices are higher than comparable dog services because cats require more specialized handling and the work tends to move slower. Most cat groomers recommend appointments every 6 to 10 weeks for longhaired breeds.",
    ],
    tips: [
      "Call ahead to confirm the groomer has cat-specific experience. A dog groomer who \"also does cats\" is not the same as a feline specialist.",
      "Keep your cat in a secure carrier during transport. Avoid feeding them for 2 hours before the appointment to reduce nausea.",
      "Start grooming your cat young if possible. Kittens that experience grooming early tend to handle it much better as adults.",
    ],
  },

  "nail-care": {
    intro:
      "Regular nail care prevents pain, joint problems, and damage to your floors. Most dogs need their nails trimmed every 3 to 4 weeks.",
    body: [
      "Professional nail care includes trimming with clippers, grinding with a Dremel-style tool, or a combination of both. Grinding produces a smoother finish and reduces the chance of cutting the quick (the blood vessel inside the nail). Some groomers offer pawdicure packages that add paw pad moisturizing and minor fur trimming between the toes.",
      "Every dog needs nail care, but it is especially critical for dogs that walk primarily on soft surfaces like grass or dirt. Dogs that spend time on pavement naturally wear their nails down, but PNW dogs walking on wet trails and soft forest floors often do not get that benefit. Overgrown nails change how a dog walks and can lead to joint strain over time.",
      "Nail trims in Washington and Oregon typically cost $10 to $25 as a standalone service. Many groomers offer walk-in nail trims without an appointment, making this one of the most accessible grooming services. If your dog is nervous about nail work, look for groomers who practice cooperative care techniques, where the dog is taught to participate willingly.",
    ],
    tips: [
      "If you can hear your dog's nails clicking on hard floors, they are overdue for a trim.",
      "Ask your groomer about Dremel grinding if your dog has dark nails where the quick is hard to see.",
      "Frequent short trims are better than infrequent long ones. The quick recedes over time when nails are kept short.",
    ],
  },

  "dog-bath": {
    intro:
      "A professional dog bath goes well beyond what you can do at home, using commercial-grade tubs, high-velocity dryers, and salon-quality products.",
    body: [
      "A standard bath service includes a warm water wash with breed-appropriate shampoo, a conditioning treatment, thorough rinsing, high-velocity blow-dry, and a full brush-out. Many groomers also include ear cleaning, nail trimming, and a light sanitary trim as part of the bath package. The high-velocity dryer is a big part of the value: it removes loose undercoat far more effectively than towel drying at home.",
      "Bath services work for all dogs, but they are particularly useful for double-coated breeds like Huskies, Golden Retrievers, and German Shepherds that do not need haircuts but do need regular washing and deshedding. In the Pacific Northwest, where rain and mud are constants for much of the year, regular baths help prevent that persistent wet-dog smell and keep skin healthy under damp conditions.",
      "Expect to pay $30 to $50 for small dogs, $40 to $65 for medium dogs, and $55 to $85 for large breeds at PNW grooming salons. Bath-only appointments are shorter than full grooms, typically 1 to 2 hours. Most groomers recommend a professional bath every 4 to 6 weeks, though active outdoor dogs may need them more often.",
    ],
    tips: [
      "Mention any skin sensitivities when booking. Good groomers stock hypoallergenic and medicated shampoo options.",
      "A bath with a high-velocity dry is the single best thing you can do for a shedding dog. It removes far more loose fur than brushing alone.",
      "If your dog gets muddy on PNW trails regularly, ask about a quick rinse or tidy-up service between full baths.",
    ],
  },

  "mobile-grooming": {
    intro:
      "Mobile grooming brings the full salon experience to your driveway. It is ideal for dogs that get anxious in unfamiliar environments or owners with limited mobility.",
    body: [
      "A mobile grooming van is a self-contained salon on wheels, equipped with a tub, warm water, professional dryers, and a grooming table. Most mobile groomers offer the same services as a brick-and-mortar shop: full grooms, baths, nail trims, and specialty treatments. The main difference is that your dog gets one-on-one attention without other animals around, which significantly reduces stress for reactive or anxious dogs.",
      "Mobile grooming is popular across the PNW, especially in suburban areas around Seattle, Portland, and smaller communities where salon options may be limited. It is also a practical choice for multi-dog households, senior pet owners, and anyone with a busy schedule. The groomer parks in your driveway, takes your dog into the van, and returns them clean and styled, typically within 1.5 to 3 hours.",
      "Mobile grooming costs more than salon grooming due to fuel, vehicle maintenance, and the one-on-one service model. In Washington and Oregon, expect to pay $80 to $130 for a small to medium dog and $120 to $180 for a large dog. Availability can be limited, so booking 2 to 4 weeks ahead is common. Many mobile groomers serve specific zip codes, so confirm your area is covered before scheduling.",
    ],
    tips: [
      "Reserve a flat, accessible parking spot in your driveway. The van needs room and access to the street.",
      "Mobile groomers often have smaller client lists, so if you find one you like, set up a recurring schedule to lock in your spot.",
      "Ask if the van uses a generator or requires an electrical hookup from your home. Most modern vans are fully self-contained.",
    ],
  },

  "self-wash": {
    intro:
      "Self-wash stations let you bathe your dog using professional equipment without the mess at home. You do the work, but the shop provides everything you need.",
    body: [
      "A self-wash station typically includes an elevated tub (so you do not have to bend over), warm water, a selection of shampoos and conditioners, a high-velocity dryer, towels, brushes, and ear cleaning supplies. Some shops also provide aprons, treat jars, and grooming tools. You wash your dog yourself, then the staff handles cleanup.",
      "Self-wash is a good fit for owners who want to stay involved in the grooming process, have dogs that behave better with their owner present, or simply want to save money compared to full-service grooming. It is also practical for quick mud baths after a rainy PNW hike without booking a full appointment. Shops typically allow 30 to 60 minutes per session.",
      "Self-wash prices in the Pacific Northwest range from $12 to $25 per session regardless of dog size. Some shops offer punch cards or monthly memberships for frequent users. This is the most affordable professional bathing option, and no appointment is usually needed. Just walk in during business hours.",
    ],
    tips: [
      "Bring your own treats to keep your dog calm and reward good behavior in the tub.",
      "Use the high-velocity dryer provided. It removes loose undercoat far better than towel drying and is worth the extra few minutes.",
      "Check if the shop provides nail clippers or Dremels. Some self-wash stations include basic nail tools as part of the fee.",
    ],
  },

  "teeth-cleaning": {
    intro:
      "Non-anesthetic teeth cleaning is a grooming add-on that helps prevent plaque buildup, gum disease, and bad breath between veterinary dental visits.",
    body: [
      "Groomer-provided teeth cleaning is a non-anesthetic service, meaning your dog stays awake throughout the process. The groomer uses specialized scaling tools to remove visible tartar from the tooth surface and follows up with brushing and sometimes an enzymatic treatment. This is not a replacement for veterinary dental work under anesthesia, but it helps maintain oral health between those more thorough cleanings.",
      "Dogs that benefit most from regular teeth cleaning include small breeds (which are prone to dental disease), senior dogs, and any dog with visible tartar buildup or persistent bad breath. Most veterinarians recommend annual professional dental cleanings under anesthesia, but non-anesthetic sessions every 2 to 3 months can slow tartar accumulation significantly.",
      "Non-anesthetic teeth cleaning typically costs $10 to $25 as an add-on to a grooming appointment, or $50 to $100 as a standalone service from a dedicated dental technician. In the PNW, several groomers partner with mobile pet dental services that visit the salon on scheduled days. Ask your groomer if they offer this directly or through a visiting technician.",
    ],
    tips: [
      "Start dental care early. Dogs accustomed to mouth handling as puppies tolerate teeth cleaning much better.",
      "Non-anesthetic cleaning works best for maintenance. If your dog has severe tartar or inflamed gums, see your veterinarian first.",
      "Ask about dental sprays or water additives you can use at home between professional cleanings.",
    ],
  },

  deshedding: {
    intro:
      "Deshedding treatments remove loose undercoat before it ends up on your furniture. For double-coated breeds in the PNW, this is one of the most valuable grooming services available.",
    body: [
      "A professional deshedding treatment involves a specialized shampoo that loosens the undercoat, followed by a high-velocity blow-dry to blast out loose fur, and a thorough brush-out with deshedding tools like undercoat rakes, slicker brushes, and Furminators. The entire process removes significantly more fur than any amount of brushing at home. A single session can reduce shedding by 60 to 80 percent for several weeks.",
      "This service is designed for double-coated breeds: Huskies, Samoyeds, Malamutes, Golden Retrievers, German Shepherds, Corgis, Australian Shepherds, and similar breeds. In the Pacific Northwest, these dogs go through heavy coat blows in spring and fall. The damp climate can also cause loose undercoat to trap moisture against the skin, leading to hot spots and irritation if not removed.",
      "Deshedding treatments in Washington and Oregon range from $40 to $75 for medium dogs and $60 to $100 for large breeds, on top of or instead of a standard bath. Most groomers recommend deshedding treatments every 6 to 8 weeks for heavy shedders, with extra sessions during seasonal coat blows in spring and fall.",
    ],
    tips: [
      "Never shave a double-coated dog to reduce shedding. The undercoat protects against heat and cold, and shaving can permanently damage it.",
      "Schedule deshedding appointments in early spring and early fall to stay ahead of seasonal coat blows.",
      "Regular brushing at home between appointments extends the results. A 10-minute session twice a week makes a real difference.",
    ],
  },

  "ear-cleaning": {
    intro:
      "Ear cleaning is a quick but important grooming service that helps prevent infections, especially for dogs with floppy ears or those who swim frequently.",
    body: [
      "Professional ear cleaning involves inspecting the ear canal for redness, discharge, or odor, then gently wiping the outer ear and canal with a vet-approved cleaning solution. For breeds with hair growing inside the ear canal (like Poodles and Bichons), the groomer may also pluck or trim excess ear hair to improve airflow. The process takes about 5 to 10 minutes per ear.",
      "Dogs most at risk for ear problems include those with floppy ears (Cocker Spaniels, Basset Hounds, Labrador Retrievers), dogs that swim or get wet frequently, and breeds prone to ear hair growth. In the PNW, where dogs are often exposed to rain and damp conditions, ear infections are a common and preventable issue. Regular cleaning helps catch problems early before they require veterinary treatment.",
      "Ear cleaning is usually included as part of a full groom or bath service at no extra charge. As a standalone service, it typically costs $5 to $15. If your dog has a history of chronic ear infections, ask your groomer to flag any early signs of trouble during each visit. Many groomers will note ear conditions on your dog's grooming record.",
    ],
    tips: [
      "If your dog's ears smell yeasty or your dog scratches at them frequently, schedule a vet visit before a grooming appointment.",
      "After swimming or bath time, gently dry the inside of your dog's ears with a soft cloth to reduce moisture buildup.",
      "Ask your groomer whether ear plucking is appropriate for your breed. The practice is debated, and not all dogs benefit from it.",
    ],
  },

  "puppy-grooming": {
    intro:
      "A puppy's first grooming experience sets the tone for a lifetime of grooming appointments. The goal is positive association, not a perfect haircut.",
    body: [
      "Puppy grooming appointments are shorter and gentler than adult grooms. A typical first visit includes a warm bath, light brush-out, nail trim, ear cleaning, and face tidying. The groomer introduces the puppy to the sounds and sensations of clippers, dryers, and handling at a slow pace, using treats and praise throughout. Many groomers limit first-groom sessions to 30 to 45 minutes.",
      "Most groomers recommend starting puppy grooming between 10 and 16 weeks of age, after the puppy has had at least two rounds of vaccinations. The goal at this stage is socialization, not styling. A puppy that learns to relax on the grooming table early will be much easier (and less expensive) to groom as an adult. Breeds with continuously growing coats should start especially early to get comfortable with the full grooming process.",
      "Puppy groom prices in Washington and Oregon typically range from $30 to $60, less than an adult groom because the sessions are shorter and less involved. Some groomers offer puppy packages with 3 to 4 introductory visits at a discounted rate. These packages are worth considering for breeds that will need lifelong professional grooming.",
    ],
    tips: [
      "Handle your puppy's paws, ears, and mouth at home before the first appointment. This makes the groomer's job easier and less stressful for your pup.",
      "Choose a groomer who specifically offers puppy introduction sessions, not just a regular groom on a young dog.",
      "Do not expect a show-quality cut on the first visit. The priority is a calm, positive experience that builds trust.",
    ],
  },

  "flea-treatment": {
    intro:
      "Flea treatment baths use medicated shampoos to kill fleas and ticks on contact. They provide immediate relief but work best as part of a broader prevention plan.",
    body: [
      "A professional flea treatment bath starts with a medicated shampoo containing ingredients that kill adult fleas and ticks on contact. The shampoo is worked into the coat and left to sit for several minutes before rinsing. The groomer then does a thorough comb-through with a flea comb to remove dead parasites and eggs. Some groomers follow up with a conditioning treatment to soothe irritated skin.",
      "Flea baths are most useful when you discover a current infestation and need immediate relief. They kill what is on the dog right now but do not provide long-term prevention. In the Pacific Northwest, flea season runs roughly from late spring through early fall, though mild winters in western Washington and Oregon mean fleas can be active year-round in some areas. Dogs that spend time outdoors, at dog parks, or around wildlife are at higher risk.",
      "Flea treatment baths in the PNW typically cost $30 to $60 on top of a regular bath or groom, depending on the products used and the severity of the infestation. Your groomer may recommend follow-up treatments. For ongoing prevention, talk to your veterinarian about monthly flea and tick preventatives, which are more effective than reactive bathing alone.",
    ],
    tips: [
      "Wash your dog's bedding, vacuum carpets, and treat your home at the same time as the bath. Fleas live in the environment, not just on the dog.",
      "Tell your groomer about any flea preventatives your dog is currently taking to avoid product interactions.",
      "If your dog has flea allergy dermatitis (excessive scratching, hair loss, hot spots), see a vet before booking a medicated bath.",
    ],
  },

  "hand-stripping": {
    intro:
      "Hand stripping is a traditional grooming technique for wire-coated breeds. It maintains the correct coat texture that clipping cannot replicate.",
    body: [
      "Hand stripping involves pulling dead hairs from the outer coat by hand or with a stripping knife, allowing new wire-textured hairs to grow in. Unlike clipping, which cuts the hair and leaves soft regrowth, hand stripping preserves the coarse, weather-resistant texture that defines wire-coated breeds. The process requires skill and patience, taking 2 to 4 hours depending on the breed and coat condition.",
      "Breeds that benefit from hand stripping include Wire Fox Terriers, Schnauzers, Airedale Terriers, Border Terriers, Irish Wolfhounds, and other wire or broken-coated breeds. Show dogs almost always require hand stripping to meet breed standard, but pet owners who want their wire-coated dog to look and feel their best also choose this method. Once a wire coat has been clipped repeatedly, it becomes soft and loses its characteristic texture, and returning to hand stripping gets more difficult.",
      "Hand stripping is one of the more expensive grooming services because of the time and expertise involved. In Washington and Oregon, expect to pay $100 to $200 or more per session. Not all groomers offer this service, so you may need to search specifically for a groomer experienced in hand stripping for your breed. Sessions are typically needed every 6 to 10 weeks to keep the coat in rotation.",
    ],
    tips: [
      "Start hand stripping when your dog is young so they get accustomed to the process early.",
      "Ask your groomer about maintaining the coat between appointments with light carding (a less intensive form of undercoat removal).",
      "If you are unsure whether your breed needs hand stripping, ask a breed-specific groomer for an assessment before committing.",
    ],
  },

  "creative-grooming": {
    intro:
      "Creative grooming includes pet-safe coloring, artistic styling, and Asian fusion cuts. It is a growing niche in the PNW grooming scene.",
    body: [
      "Creative grooming covers a range of artistic services, from subtle color accents (colored tail tips, dyed ears, stenciled patterns) to full-body color transformations and sculpted styles. Asian fusion grooming, which originated in East Asia, emphasizes round, sculpted shapes and exaggerated proportions for a plush-toy aesthetic. All products used are pet-safe, non-toxic dyes specifically formulated for animal use.",
      "This service is best suited for dogs with light-colored or white coats that show color well, and for breeds with enough coat length to hold a sculpted shape (Poodles, Bichons, and similar). Creative grooming is purely cosmetic and does not affect the dog's comfort or health when done with proper products. It has become increasingly popular at grooming competitions and on social media, and several PNW groomers have won national creative grooming awards.",
      "Pricing varies widely depending on the complexity of the work. A simple color accent may add $20 to $40 to a regular groom, while a full creative transformation can cost $150 to $300 or more. Asian fusion cuts typically fall in the $80 to $150 range. Because creative work takes extra time, expect longer appointments and book well in advance with groomers who specialize in this area.",
    ],
    tips: [
      "Only use groomers who work with pet-safe, veterinary-approved dyes. Human hair dye is toxic to animals.",
      "Start with a small accent (like a colored tail or ear tips) to see how your dog handles the extra process time.",
      "Check the groomer's portfolio before booking. Creative grooming results vary greatly depending on skill level.",
    ],
  },

  boarding: {
    intro:
      "Pet boarding provides overnight care when you travel. Many PNW boarding facilities also offer grooming services so your dog comes home clean.",
    body: [
      "Boarding facilities range from basic kennel runs to luxury suites with beds, cameras, and individual play areas. Standard boarding includes meals (you supply the food or the facility provides it), fresh water, supervised potty breaks, and basic monitoring. Many facilities offer add-ons like extra playtime, one-on-one walks, grooming, and webcam access so you can check on your dog remotely.",
      "When choosing a boarding facility, visit in person before booking. Check that the space is clean, well-ventilated, and staffed appropriately for the number of dogs. Ask about their policies on vaccinations (most require current DHLPP, rabies, and bordetella), their emergency vet protocol, and how they handle dogs that do not get along. In the PNW, look for facilities with covered outdoor areas since rain is a factor most of the year.",
      "Boarding rates in Washington and Oregon typically run $35 to $60 per night for standard accommodations and $55 to $100 per night for premium suites. Holiday periods (Thanksgiving, Christmas, and summer) book up fast and may carry surcharge fees. Many facilities offer grooming packages so your dog gets a bath or full groom before pickup, which is a convenient option after an extended stay.",
    ],
    tips: [
      "Book holiday boarding 4 to 8 weeks in advance. PNW facilities fill up quickly during peak travel periods.",
      "Bring your dog's own food, a familiar blanket, and a piece of clothing that smells like you to reduce stress.",
      "Ask if the facility separates dogs by size during group play. This is important for the safety of small dogs.",
    ],
  },

  daycare: {
    intro:
      "Dog daycare provides supervised socialization and exercise during the workday. It is a popular option for high-energy breeds and dogs that do not do well alone at home.",
    body: [
      "Daycare facilities provide supervised group play, rest periods, fresh water, and potty breaks throughout the day. Dogs are typically separated by size and temperament into play groups. Most facilities open early (6 or 7 AM) and close in the evening (6 or 7 PM), with flexible pickup times. Some offer grooming add-ons so you can pick up a tired, clean dog at the end of the day.",
      "Daycare is a good fit for dogs that are social, have high energy levels, or experience separation anxiety when left home alone. Breeds like Labrador Retrievers, Australian Shepherds, and Border Collies often thrive in a daycare environment. However, not every dog enjoys group play. Most facilities require a temperament evaluation before the first day to make sure the dog is a safe fit for their play groups.",
      "Daily daycare rates across the PNW range from $25 to $50 per day, with multi-day packages and monthly memberships bringing the per-day cost down. A typical 5-day weekly package runs $100 to $200 per week. Some facilities offer half-day rates for shorter stays. When evaluating a daycare, ask about their staff-to-dog ratio (1:10 to 1:15 is standard), vaccination requirements, and how they manage rest periods to prevent overstimulation.",
    ],
    tips: [
      "Request a tour and watch how the staff interacts with the dogs during group play before committing.",
      "Start with a half-day trial. Not every dog enjoys daycare, and a short first visit helps you gauge your dog's response.",
      "Make sure your dog is up to date on all required vaccinations, including bordetella (kennel cough), before the evaluation day.",
    ],
  },
};

export function getServiceContent(slug: string): ServiceContent | undefined {
  return SERVICE_CONTENT[slug];
}
