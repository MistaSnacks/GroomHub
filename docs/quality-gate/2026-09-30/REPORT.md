# GroomLocal page quality gate, 2026-09-30

Audit only. Nothing on the site, database, or robots was changed.

> **Caveat:** Do not ship structural changes (bulk noindex, merges, redirects, sitemap pruning) until Google's September 2026 spam update finishes rolling out (expected around Oct 8, 2026). Changing many URLs mid-rollout makes it impossible to tell our changes from the update.

## Verdict counts

| page type | INDEX | IMPROVE | MERGE | NOINDEX | NOINDEX-UNTIL-ENRICHED |
|---|---|---|---|---|---|
| dog-grooming | 2 | 79 | 98 | 89 | 0 |
| cat-grooming | 1 | 8 | 8 | 95 | 0 |
| mobile-grooming | 0 | 0 | 2 | 34 | 0 |
| groomer | 7 | 1114 | 0 | 0 | 9 |

City rows include every city with at least one listing (pages under 3 listings are already noindex on the site). Cat/mobile rows include every city with at least one tagged listing.

How to read: **INDEX** keep as is. **IMPROVE** stays indexable but needs enrichment (photos, prices, real descriptions, claims). **MERGE** stops being a standalone indexable page and folds into the named hub. **NOINDEX** / **NOINDEX-UNTIL-ENRICHED** come out of the index and the sitemap until the data improves.

Of the 131 dog-grooming city pages the site currently indexes (3+ listings): 79 IMPROVE, 31 MERGE, 19 NOINDEX, 2 INDEX.

## Profiles

- 1130 public profiles; 1070 carry the import template description or none at all.
- 1106 had at least one page view in the last 90 days (views include bots).
- 475 profiles would be NOINDEX-UNTIL-ENRICHED on data alone but are kept at IMPROVE because they have views. Because nearly every profile gets bot views, this rule protects almost everything; rerun with `--gsc-csv` (GSC Pages export) to protect on real impressions instead.
- Score distribution (max 12): {0: 4, 1: 20, 2: 165, 3: 295, 4: 607, 5: 22, 6: 10, 7: 3, 8: 3, 12: 1}

## Proposed hubs and merges

- **Salem** (16 listings, `OR:salem`) absorbs: Silverton (4, 14.0 mi), Dallas (2, 12.1 mi, already noindex), Monmouth (2, 10.4 mi, already noindex), Stayton (2, 13.5 mi, already noindex), Aumsville (1, 8.1 mi, already noindex), Independence (1, 8.3 mi, already noindex)
- **Bellevue** (10 listings, `WA:bellevue`) absorbs: Issaquah (4, 7.3 mi), Carnation (3, 12.1 mi), Sammamish (2, 5.8 mi, already noindex), Mercer Island (1, 4.5 mi, already noindex), Newcastle (1, 5.5 mi, already noindex), Union Hill-Novelty Hill (1, 7.4 mi, already noindex)
- **Spokane** (18 listings, `WA:spokane`) absorbs: Cheney (4, 14.5 mi), Airway Heights (1, 9.2 mi, already noindex), Fairwood (1, 4.9 mi, already noindex), Mead (1, 5.3 mi, already noindex), Nine Mile Falls (1, 10.2 mi, already noindex)
- **Monroe** (10 listings, `WA:monroe`) absorbs: Snohomish (4, 7.6 mi), Mill Creek (3, 10.0 mi), Duvall (2, 9.2 mi, already noindex), Gold Bar (1, 11.8 mi, already noindex), Sultan (1, 6.9 mi, already noindex)
- **Lake Oswego** (8 listings, `OR:lake-oswego`) absorbs: Happy Valley (3, 5.5 mi), West Linn (3, 2.2 mi), Clackamas (2, 4.6 mi, already noindex), Gladstone (1, 4.1 mi, already noindex), Oak Grove (1, 2.1 mi, already noindex)
- **Kent** (8 listings, `WA:kent`) absorbs: Maple Valley (3, 8.6 mi), SeaTac (3, 7.7 mi), Tukwila (2, 5.9 mi, already noindex), Covington (1, 5.0 mi, already noindex), Des Moines (1, 5.7 mi, already noindex)
- **Yakima** (14 listings, `WA:yakima`) absorbs: Moxee (1, 8.2 mi, already noindex), Naches (1, 5.3 mi, already noindex), Selah (1, 7.3 mi, already noindex), Union Gap (1, 3.9 mi, already noindex), Wapato (1, 12.5 mi, already noindex)
- **Tigard** (8 listings, `OR:tigard`) absorbs: Newberg (4, 12.7 mi), Tualatin (3, 3.8 mi), Wilsonville (3, 9.5 mi), King City (1, 2.1 mi, already noindex)
- **Gresham** (8 listings, `OR:gresham`) absorbs: Sandy (4, 10.3 mi), Boring (1, 5.1 mi, already noindex), Eagle Creek (1, 12.0 mi, already noindex), Troutdale (1, 1.9 mi, already noindex)
- **Vancouver** (21 listings, `WA:vancouver`) absorbs: Washougal (4, 12.0 mi), Battle Ground (3, 9.0 mi), Ridgefield (2, 10.1 mi, already noindex), Brush Prairie (1, 5.6 mi, already noindex)
- **Puyallup** (14 listings, `WA:puyallup`) absorbs: Buckley (2, 11.0 mi, already noindex), Edgewood (2, 5.0 mi, already noindex), Orting (1, 5.9 mi, already noindex), Sumner (1, 5.1 mi, already noindex)
- **Albany** (11 listings, `OR:albany`) absorbs: Lebanon (4, 11.7 mi), Adair Village (1, 5.7 mi, already noindex), Philomath (1, 14.5 mi, already noindex)
- **Longview** (10 listings, `WA:longview`) absorbs: Kalama (4, 11.9 mi), Castle Rock (1, 10.9 mi, already noindex), Kelso (1, 3.1 mi, already noindex)
- **Bellingham** (15 listings, `WA:bellingham`) absorbs: Lynden (4, 9.3 mi), Ferndale (3, 8.8 mi), Everson (1, 7.6 mi, already noindex)
- **Richland** (8 listings, `WA:richland`) absorbs: Pasco (4, 4.2 mi), West Richland (3, 3.4 mi), Benton City (2, 9.1 mi, already noindex)
- **Seattle** (51 listings, `WA:seattle`) absorbs: Edmonds (3, 9.8 mi), Mountlake Terrace (3, 10.7 mi), Kenmore (1, 9.2 mi, already noindex)
- **Medford** (14 listings, `OR:medford`) absorbs: Ashland (2, 13.4 mi, already noindex), Eagle Point (2, 8.1 mi, already noindex), White City (2, 4.0 mi, already noindex)
- **Yelm** (9 listings, `WA:yelm`) absorbs: Eatonville (2, 10.9 mi, already noindex), McKenna (1, 1.5 mi, already noindex), Rainier (1, 6.1 mi, already noindex)
- **Lakewood** (10 listings, `WA:lakewood`) absorbs: University Place (4, 3.4 mi), DuPont (1, 7.7 mi, already noindex)
- **Bremerton** (8 listings, `WA:bremerton`) absorbs: Bainbridge Island (3, 7.4 mi), Silverdale (3, 4.9 mi)
- **Auburn** (8 listings, `WA:auburn`) absorbs: Enumclaw (3, 13.1 mi), Black Diamond (1, 10.0 mi, already noindex)
- **Spokane Valley** (11 listings, `WA:spokane-valley`) absorbs: Liberty Lake (3, 6.7 mi), Millwood (3, 2.2 mi)
- **Hillsboro** (10 listings, `OR:hillsboro`) absorbs: Cornelius (2, 6.2 mi, already noindex), Gaston (1, 11.9 mi, already noindex)
- **Roseburg** (12 listings, `OR:roseburg`) absorbs: Sutherlin (2, 13.3 mi, already noindex), Winston (1, 6.0 mi, already noindex)
- **Grants Pass** (15 listings, `OR:grants-pass`) absorbs: Merlin (1, 9.5 mi, already noindex), Rogue River (1, 8.3 mi, already noindex)
- **Stanwood** (8 listings, `WA:stanwood`) absorbs: Camano (1, 3.9 mi, already noindex), Mount Vernon (1, 11.3 mi, already noindex)
- **Port Orchard** (8 listings, `WA:port-orchard`) absorbs: Vashon (3, 9.4 mi)
- **Olympia** (13 listings, `WA:olympia`) absorbs: Tumwater (2, 4.2 mi, already noindex)
- **Eugene** (15 listings, `OR:eugene`) absorbs: Junction City (1, 11.1 mi, already noindex)
- **Springfield** (8 listings, `OR:springfield`) absorbs: Pleasant Hill (1, 7.1 mi, already noindex)
- **Port Angeles** (11 listings, `WA:port-angeles`) absorbs: Carlsborg (1, 12.1 mi, already noindex)
- **Tacoma** (22 listings, `WA:tacoma`) absorbs: Fircrest (1, 3.7 mi, already noindex)
- **Anacortes** (8 listings, `WA:anacortes`) absorbs: La Conner (1, 9.1 mi, already noindex)
- **Poulsbo** (8 listings, `WA:poulsbo`) absorbs: Port Ludlow (1, 13.2 mi, already noindex)

Merge means: the thin city page stops being indexable (noindex,follow, or a 301 to the hub once the hub shows a "nearby" section listing those groomers), the hub page lists or links the absorbed towns, and the thin URL leaves the sitemap.

## City pages currently indexable that fail the gate (50)

| url | listings | enriched | verdict | target / reason |
|---|---|---|---|---|
| /dog-grooming/or/coos-bay | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/happy-valley | 3 | 0 | MERGE | /dog-grooming/or/lake-oswego |
| /dog-grooming/or/hermiston | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/newport | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/north-bend | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/ontario | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/seaside | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/sweet-home | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/tualatin | 3 | 1 | MERGE | /dog-grooming/or/tigard |
| /dog-grooming/or/west-linn | 3 | 0 | MERGE | /dog-grooming/or/lake-oswego |
| /dog-grooming/or/wilsonville | 3 | 0 | MERGE | /dog-grooming/or/tigard |
| /dog-grooming/wa/bainbridge-island | 3 | 1 | MERGE | /dog-grooming/wa/bremerton |
| /dog-grooming/wa/battle-ground | 3 | 0 | MERGE | /dog-grooming/wa/vancouver |
| /dog-grooming/wa/blaine | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/carnation | 3 | 0 | MERGE | /dog-grooming/wa/bellevue |
| /dog-grooming/wa/chehalis | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/edmonds | 3 | 1 | MERGE | /dog-grooming/wa/seattle |
| /dog-grooming/wa/enumclaw | 3 | 0 | MERGE | /dog-grooming/wa/auburn |
| /dog-grooming/wa/ferndale | 3 | 0 | MERGE | /dog-grooming/wa/bellingham |
| /dog-grooming/wa/liberty-lake | 3 | 0 | MERGE | /dog-grooming/wa/spokane-valley |
| /dog-grooming/wa/long-beach | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/maple-valley | 3 | 0 | MERGE | /dog-grooming/wa/kent |
| /dog-grooming/wa/mill-creek | 3 | 0 | MERGE | /dog-grooming/wa/monroe |
| /dog-grooming/wa/millwood | 3 | 0 | MERGE | /dog-grooming/wa/spokane-valley |
| /dog-grooming/wa/mountlake-terrace | 3 | 0 | MERGE | /dog-grooming/wa/seattle |
| /dog-grooming/wa/omak | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/rochester | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/seatac | 3 | 0 | MERGE | /dog-grooming/wa/kent |
| /dog-grooming/wa/silverdale | 3 | 0 | MERGE | /dog-grooming/wa/bremerton |
| /dog-grooming/wa/snoqualmie | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/vashon | 3 | 0 | MERGE | /dog-grooming/wa/port-orchard |
| /dog-grooming/wa/west-richland | 3 | 0 | MERGE | /dog-grooming/wa/richland |
| /dog-grooming/wa/woodland | 3 | 0 | NOINDEX | 3 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/lebanon | 4 | 0 | MERGE | /dog-grooming/or/albany |
| /dog-grooming/or/newberg | 4 | 0 | MERGE | /dog-grooming/or/tigard |
| /dog-grooming/or/sandy | 4 | 0 | MERGE | /dog-grooming/or/gresham |
| /dog-grooming/or/silverton | 4 | 0 | MERGE | /dog-grooming/or/salem |
| /dog-grooming/or/st-helens | 4 | 0 | NOINDEX | 4 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/or/the-dalles | 4 | 0 | NOINDEX | 4 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/cheney | 4 | 0 | MERGE | /dog-grooming/wa/spokane |
| /dog-grooming/wa/issaquah | 4 | 0 | MERGE | /dog-grooming/wa/bellevue |
| /dog-grooming/wa/kalama | 4 | 0 | MERGE | /dog-grooming/wa/longview |
| /dog-grooming/wa/lynden | 4 | 0 | MERGE | /dog-grooming/wa/bellingham |
| /dog-grooming/wa/montesano | 4 | 0 | NOINDEX | 4 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/ocean-shores | 4 | 0 | NOINDEX | 4 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/pasco | 4 | 0 | MERGE | /dog-grooming/wa/richland |
| /dog-grooming/wa/shelton | 4 | 0 | NOINDEX | 4 listings, 0 enriched, no hub within 15 mi |
| /dog-grooming/wa/snohomish | 4 | 0 | MERGE | /dog-grooming/wa/monroe |
| /dog-grooming/wa/university-place | 4 | 0 | MERGE | /dog-grooming/wa/lakewood |
| /dog-grooming/wa/washougal | 4 | 0 | MERGE | /dog-grooming/wa/vancouver |

## City pages to IMPROVE (79)

| url | listings | enriched | photos | price | reason |
|---|---|---|---|---|---|
| /dog-grooming/or/portland | 30 | 2 | 0.1 | 0.0 | 30 listings but only 2 enriched (need 3) |
| /dog-grooming/wa/tacoma | 22 | 0 | 0.05 | 0.0 | 22 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/vancouver | 21 | 1 | 0.05 | 0.0 | 21 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/spokane | 18 | 1 | 0.06 | 0.0 | 18 listings but only 1 enriched (need 3) |
| /dog-grooming/or/salem | 16 | 0 | 0.0 | 0.0 | 16 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/kennewick | 16 | 0 | 0.06 | 0.0 | 16 listings but only 0 enriched (need 3) |
| /dog-grooming/or/bend | 15 | 1 | 0.07 | 0.0 | 15 listings but only 1 enriched (need 3) |
| /dog-grooming/or/eugene | 15 | 0 | 0.0 | 0.0 | 15 listings but only 0 enriched (need 3) |
| /dog-grooming/or/grants-pass | 15 | 0 | 0.0 | 0.0 | 15 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/bellingham | 15 | 2 | 0.13 | 0.0 | 15 listings but only 2 enriched (need 3) |
| /dog-grooming/or/medford | 14 | 0 | 0.0 | 0.0 | 14 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/puyallup | 14 | 0 | 0.0 | 0.0 | 14 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/yakima | 14 | 0 | 0.0 | 0.0 | 14 listings but only 0 enriched (need 3) |
| /dog-grooming/or/redmond | 13 | 0 | 0.0 | 0.0 | 13 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/gig-harbor | 13 | 1 | 0.08 | 0.0 | 13 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/olympia | 13 | 0 | 0.0 | 0.0 | 13 listings but only 0 enriched (need 3) |
| /dog-grooming/or/roseburg | 12 | 0 | 0.0 | 0.0 | 12 listings but only 0 enriched (need 3) |
| /dog-grooming/or/albany | 11 | 0 | 0.0 | 0.0 | 11 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/port-angeles | 11 | 0 | 0.0 | 0.0 | 11 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/spokane-valley | 11 | 1 | 0.0 | 0.09 | 11 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/bellevue | 10 | 1 | 0.2 | 0.0 | 10 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/ellensburg | 10 | 0 | 0.0 | 0.0 | 10 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/federal-way | 10 | 0 | 0.0 | 0.0 | 10 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/lakewood | 10 | 1 | 0.2 | 0.1 | 10 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/longview | 10 | 0 | 0.1 | 0.0 | 10 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/monroe | 10 | 0 | 0.0 | 0.0 | 10 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/walla-walla | 10 | 0 | 0.0 | 0.0 | 10 listings but only 0 enriched (need 3) |
| /dog-grooming/or/beaverton | 9 | 1 | 0.11 | 0.0 | 9 listings but only 1 enriched (need 3) |
| /dog-grooming/or/klamath-falls | 9 | 0 | 0.0 | 0.0 | 9 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/lacey | 9 | 0 | 0.0 | 0.0 | 9 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/moses-lake | 9 | 0 | 0.0 | 0.0 | 9 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/yelm | 9 | 0 | 0.0 | 0.0 | 9 listings but only 0 enriched (need 3) |
| /dog-grooming/or/florence | 8 | 0 | 0.0 | 0.0 | 8 listings but only 0 enriched (need 3) |
| /dog-grooming/or/gresham | 8 | 1 | 0.0 | 0.12 | 8 listings but only 1 enriched (need 3) |
| /dog-grooming/or/lake-oswego | 8 | 1 | 0.12 | 0.0 | 8 listings but only 1 enriched (need 3) |
| /dog-grooming/or/springfield | 8 | 1 | 0.12 | 0.0 | 8 listings but only 1 enriched (need 3) |
| /dog-grooming/or/tigard | 8 | 0 | 0.12 | 0.0 | 8 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/anacortes | 8 | 0 | 0.0 | 0.0 | 8 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/auburn | 8 | 0 | 0.0 | 0.0 | 8 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/bremerton | 8 | 1 | 0.12 | 0.0 | 8 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/kent | 8 | 1 | 0.12 | 0.12 | 8 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/port-orchard | 8 | 0 | 0.0 | 0.0 | 8 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/poulsbo | 8 | 1 | 0.0 | 0.0 | 8 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/richland | 8 | 0 | 0.0 | 0.0 | 8 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/stanwood | 8 | 0 | 0.0 | 0.0 | 8 listings but only 0 enriched (need 3) |
| /dog-grooming/or/corvallis | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/arlington | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/bothell | 7 | 0 | 0.14 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/burlington | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/everett | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/kirkland | 7 | 1 | 0.0 | 0.0 | 7 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/marysville | 7 | 1 | 0.14 | 0.14 | 7 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/renton | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/sequim | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/wenatchee | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/woodinville | 7 | 0 | 0.0 | 0.0 | 7 listings but only 0 enriched (need 3) |
| /dog-grooming/or/keizer | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/or/oregon-city | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/or/prineville | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/or/sherwood | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/bonney-lake | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/graham | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/lake-stevens | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/oak-harbor | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/redmond | 6 | 0 | 0.0 | 0.0 | 6 listings but only 0 enriched (need 3) |
| /dog-grooming/or/canby | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/or/central-point | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/or/forest-grove | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/or/hood-river | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/or/lincoln-city | 5 | 0 | 0.2 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/or/milwaukie | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/aberdeen | 5 | 0 | 0.2 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/burien | 5 | 1 | 0.0 | 0.0 | 5 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/centralia | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/east-wenatchee | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/lynnwood | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/port-townsend | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |
| /dog-grooming/wa/shoreline | 5 | 1 | 0.2 | 0.0 | 5 listings but only 1 enriched (need 3) |
| /dog-grooming/wa/spanaway | 5 | 0 | 0.0 | 0.0 | 5 listings but only 0 enriched (need 3) |

## Top 30 IMPROVE profiles by views (enrichment targets)

| profile | city | views 90d | score | missing |
|---|---|---|---|---|
| [Aloha Tiki Tails](https://groomlocal.com/groomer/aloha-tiki-tails-graham) | graham | 29 | 4 | description; photos; price; booking link |
| [Alpha Dog Pet Grooming](https://groomlocal.com/groomer/alpha-dog-pet-grooming-lebanon) | lebanon | 25 | 1 | description; photos; price; hours; website; phone; booking link |
| [Kelly's K9 Design](https://groomlocal.com/groomer/kellys-k9-design-covington) | covington | 23 | 3 | description; photos; price; website; booking link |
| [99 Problems But Groom'n Ain't 1](https://groomlocal.com/groomer/99-problems-but-groomn-aint-1-tacoma) | tacoma | 23 | 4 | description; photos; price; booking link |
| [Darkworth's Paw Emporium LLC](https://groomlocal.com/groomer/darkworths-paw-emporium-llc-ferndale) | ferndale | 19 | 3 | description; photos; price; website; booking link |
| [The Purple Pet Lady](https://groomlocal.com/groomer/the-purple-pet-lady-silverton) | silverton | 17 | 3 | description; photos; price; website; booking link |
| [Canine Paradigm llc](https://groomlocal.com/groomer/canine-paradigm-llc-silverton) | silverton | 15 | 4 | description; photos; price; booking link |
| [RUFF](https://groomlocal.com/groomer/ruff-lacey) | lacey | 12 | 3 | description; photos; price; hours; booking link |
| [Sellwood Grooming](https://groomlocal.com/groomer/sellwood-grooming-portland) | portland | 11 | 2 | description; photos; price; hours; website; booking link |
| [Urban Doggie Mobile Dog Grooming](https://groomlocal.com/groomer/urban-doggie-kirkland) | kirkland | 11 | 6 | description; photos; price; booking link |
| [Anna's Grooming](https://groomlocal.com/groomer/anna-s-grooming-mead) | mead | 10 | 2 | description; photos; price; hours; website; booking link |
| [Tosha's Pet Grooming](https://groomlocal.com/groomer/toshas-pet-grooming-tacoma) | tacoma | 10 | 2 | description; photos; price; hours; website; booking link |
| [CK9 Pet Salon](https://groomlocal.com/groomer/ck9-pet-salon) | eugene | 10 | 2 | description; photos; price; hours; website; booking link |
| [Maizey’s Groom Crew](https://groomlocal.com/groomer/maizey-s-groom-crew-lebanon) | lebanon | 10 | 2 | description; photos; price; website; phone; booking link |
| [The Groom Reaper LLC](https://groomlocal.com/groomer/the-groom-reaper-llc-keizer) | keizer | 10 | 3 | description; photos; price; website; booking link |
| [Grooming Tails](https://groomlocal.com/groomer/grooming-tails-klamath-falls) | klamath-falls | 10 | 3 | description; photos; price; website; booking link |
| [Wilco Farm Store](https://groomlocal.com/groomer/wilco-farm-store-corvallis) | corvallis | 10 | 4 | description; photos; price; booking link |
| [Zelda's Pet Grooming](https://groomlocal.com/groomer/zelda-s-pet-grooming-pullman) | pullman | 10 | 4 | description; price; hours; booking link |
| [Kristi’s Grooming Company](https://groomlocal.com/groomer/kristi-s-grooming-company-seattle) | seattle | 9 | 2 | description; photos; price; hours; website; booking link |
| [Best Friends Dog Grooming](https://groomlocal.com/groomer/best-friends-dog-grooming-vancouver) | vancouver | 9 | 3 | description; photos; price; website; booking link |
| [The Spawt LLC](https://groomlocal.com/groomer/the-spawt-llc-sunnyside) | sunnyside | 9 | 3 | description; photos; price; website; booking link |
| [Hair of the Dog](https://groomlocal.com/groomer/hair-of-the-dog-portland) | portland | 9 | 3 | description; photos; price; hours; booking link |
| [Woods Creek Kennels](https://groomlocal.com/groomer/woods-creek-kennels-monroe) | monroe | 9 | 4 | description; photos; price; booking link |
| [Shannon's Pet Stylin](https://groomlocal.com/groomer/shannons-pet-stylin-dallas) | dallas | 9 | 4 | description; photos; price; booking link |
| [Cute Cuts Dog Grooming & Self-Wash](https://groomlocal.com/groomer/cute-cuts-dog-grooming-self-wash-hillsboro) | hillsboro | 9 | 6 | description; price; hours |
| [Messy Mutts](https://groomlocal.com/groomer/messy-mutts-ellensburg) | ellensburg | 8 | 2 | description; photos; price; hours; website; booking link |
| [Pup Scrub](https://groomlocal.com/groomer/pup-scrub-wa) | seattle | 8 | 4 | photos; price; website; phone; booking link |
| [Grooming By Kristi](https://groomlocal.com/groomer/grooming-by-kristi-yakima) | yakima | 7 | 2 | description; photos; price; hours; website; booking link |
| [Drewbie's Doghouse](https://groomlocal.com/groomer/drewbie-s-doghouse) | yakima | 7 | 2 | description; photos; price; hours; website; booking link |
| [Happy Tails Dog Grooming](https://groomlocal.com/groomer/happy-tails-dog-grooming-walla-walla) | walla-walla | 7 | 2 | description; photos; price; hours; website; booking link |

## Sitemap hygiene

- Sitemap index lastmods: ['2026-09-02']
- `https://groomlocal.com/sitemap/0.xml`: 68 URLs {'other': 68}; top lastmod 2026-09-02 on 69%
- `https://groomlocal.com/sitemap/1.xml`: 1130 URLs {'groomer': 1130}; top lastmod 2026-09-02 on 100% **UNIFORM**
- `https://groomlocal.com/sitemap/2.xml`: 150 URLs {'dog-grooming': 131, 'cat-grooming': 17, 'mobile-grooming': 2}; top lastmod 2026-09-02 on 100% **UNIFORM**
- Root cause: `business_listings` has no `updated_at` column, so `lastModFrom(listing.updated_at)` in `src/app/sitemap.ts` always falls back to `STATIC_LASTMOD` (2026-09-02). Every profile and city lastmod is fake.
- 69 sitemap URLs get a non-INDEX verdict: {'MERGE': 41, 'NOINDEX': 19, 'NOINDEX-UNTIL-ENRICHED': 9}
- Listing-count distribution of the 40 smallest indexable dog-grooming city pages: {3: 33, 4: 7}

## Live calibration (what the page actually shows)

| url | status | db count | shown count | robots | CSR bailout | <a> to profiles | JSON-LD items |
|---|---|---|---|---|---|---|---|
| /dog-grooming/or/coos-bay | 200 | 3 | 3 | (index) | True | 0 | 7 |
| /dog-grooming/or/happy-valley | 200 | 3 | 3 | (index) | True | 0 | 7 |
| /dog-grooming/or/hermiston | 200 | 3 | 3 | (index) | True | 0 | 7 |
| /dog-grooming/or/newport | 200 | 3 | 3 | (index) | True | 0 | 7 |
| /dog-grooming/or/north-bend | 200 | 3 | 3 | (index) | True | 0 | 7 |
| /dog-grooming/or/ontario | 200 | 3 | 3 | (index) | True | 0 | 7 |
| /dog-grooming/or/portland | 200 | 30 | 30 | (index) | True | 0 | 24 |
| /dog-grooming/wa/seattle | 200 | 51 | 51 | (index) | True | 0 | 24 |

The page shows only same-city listings (no nearby-city spillover in the list). Spillover exists only in the Featured block (`getFeaturedByCity`, metro clusters); 0 listings have is_featured=true today.

## Facets (?services= / ?specialties=)

- Crawlable facet links are emitted by: `src/app/specialties/[slug]/page.tsx:158`, `src/app/services/[slug]/page.tsx:211`.
- Those hub pages emit 569 `?services=` and 213 `?specialties=` city links; 272 point at city pages that are noindex; 361 filter to every listing on the page (exact duplicates; `full-groom` is the default tag for any listing without a matched service).
- City page canonical strips params: True. Server reads searchParams: False. robots.txt blocks params: False. X-Robots-Tag on param URLs: False.
- Live check on `https://groomlocal.com/dog-grooming/or/canby`: canonical 200, `?services=full-groom` 200, junk values 200. Facet HTML identical to canonical: True; junk-facet HTML identical: True. Facet canonical: `https://groomlocal.com/dog-grooming/or/canby`, robots meta: `none`.
- The listing grid is client-rendered (CSR bailout: True); server HTML has 0 `<a>` links to groomer profiles. Every facet URL is a byte-identical copy that relies on a canonical hint, which Google may ignore (2026-09-30 research found `/dog-grooming/or/keizer?services=full-groom` ranking instead of the clean URL).
- Recommendation: (1) make the `/services/<slug>` and `/specialties/<slug>` city chips link to the clean city URL (or a hub-local anchor) and only for cities that pass the gate; (2) add `X-Robots-Tag: noindex, follow` for city URLs carrying `services|specialties|features|price|sort` via `headers()` in `next.config.ts` (keeps ISR; no searchParams read); (3) return 404 for unknown facet values (middleware), per Google's faceted-navigation guidance; (4) only after Google has recrawled the noindex, consider a robots.txt disallow for those params. Do not disallow first: a blocked URL cannot show its noindex.

## Other findings

- Legacy `cities` table: 275 rows, 275 disagree with live listing counts. The site does not use it for counts; do not build gate logic on it.
- 26 city pages print a stale groomer count in the intro from `src/data/city-enrichment.json` (`listingCount`) that differs from the live count in the H1.

## Proposed implementation change list (owner approval required; separate code change)

1. `src/lib/index-gate.ts` (new): one shared gate function with these thresholds, used by every page type and the sitemap.
2. `src/app/dog-grooming/[state]/[city]/page.tsx` `generateMetadata`: replace `groomerCount >= 3` with the gate; render the listing grid server-side (only the filter bar needs `useSearchParams`) so profile links are in the HTML.
3. `src/components/city-listings-inner.tsx` / `city-listings-client.tsx`: split the Suspense boundary so cards render on the server.
4. `src/app/cat-grooming/[state]/[city]/page.tsx` and `src/app/mobile-grooming/[state]/[city]/page.tsx`: same gate; MERGE verdicts become noindex,follow with a link to the dog-grooming city page.
5. `src/app/sitemap.ts`: emit only INDEX/IMPROVE pages from the gate; stop using fake lastmod (add an `updated_at` column + trigger to `business_listings` via a migration, or omit lastmod until real).
6. `src/app/services/[slug]/page.tsx` (~L211) and `src/app/specialties/[slug]/page.tsx` (~L158): stop emitting `?services=` / `?specialties=` links; link clean city URLs for gate-passing cities only.
7. `next.config.ts` `headers()`: `X-Robots-Tag: noindex, follow` when facet query keys are present; `src/middleware.ts`: 404 unknown facet values.
8. Hubs: `src/lib/metro-clusters.ts` plus a "nearby towns" section on hub pages listing absorbed-city groomers; then noindex (or 301 via `next.config.ts` redirects) the absorbed city URLs.
9. `src/app/groomer/[slug]/page.tsx` `generateMetadata`: add `robots: noindex,follow` only for NOINDEX-UNTIL-ENRICHED profiles (rerun the gate first; never for claimed or viewed profiles).
10. `src/data/city-enrichment.json` / `src/lib/city-content.ts`: compute the intro count from live listings.

Ship after the spam update settles (~Oct 8, 2026), in small batches, watching GSC indexing for 2 to 4 weeks between batches.
