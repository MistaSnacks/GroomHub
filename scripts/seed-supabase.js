const fs = require('fs');

async function generateSqls() {
    const dataRaw = fs.readFileSync('./data/groomers_enriched.json', 'utf8');
    const records = JSON.parse(dataRaw);

    // 1. GATHER CITIES
    const uniqueCitiesMap = new Map();
    for (const record of records) {
        if (!record.city) continue;
        const citySlug = record.city_slug || record.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const state = record.state || 'WA';
        uniqueCitiesMap.set(citySlug, {
            slug: citySlug, name: record.city, state: state, state_abbr: state, groomer_count: 0, image: '', description: ''
        });
        record.city_slug = citySlug;
    }
    const citiesArray = Array.from(uniqueCitiesMap.values());
    const cityVals = citiesArray.map(c => `('${c.slug.replace(/'/g, "''")}', '${c.name.replace(/'/g, "''")}', '${c.state.replace(/'/g, "''")}', '${c.state_abbr.replace(/'/g, "''")}', 0, '', '')`);
    const citiesSql = `INSERT INTO public.cities (slug, name, state, state_abbr, groomer_count, image, description)\nVALUES\n${cityVals.join(',\n')}
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, state_abbr = EXCLUDED.state_abbr, image = EXCLUDED.image, description = EXCLUDED.description;\n`;

    fs.writeFileSync('./data/seed_cities.sql', citiesSql);

    // 2. GATHER BUSINESS LISTINGS
    const sanitizeText = (t) => t ? `'${String(t).replace(/'/g, "''")}'` : 'NULL';
    const sanitizeNum = (n) => n !== null && n !== undefined && !isNaN(n) ? Number(n) : 'NULL';
    const sanitizeBool = (b) => b ? 'true' : 'false';
    const sanitizeArrayText = (arr) => arr && arr.length ? `ARRAY[${arr.map(a => sanitizeText(a)).join(',')}]::text[]` : "ARRAY[]::text[]";
    const sanitizeJsonArray = (arr) => arr && arr.length ? `ARRAY[${arr.map(a => sanitizeText(JSON.stringify(a))).join(',')}]::jsonb[]` : "ARRAY[]::jsonb[]";

    const listingVals = records.map(record => {
        let formattedHours = null;
        if (record.hours && typeof record.hours === 'object') formattedHours = [record.hours];
        return `(${sanitizeText(record.slug)}, ${sanitizeText(record.slug)}, ${sanitizeText(record.name)}, ${sanitizeText(record.description)}, ${sanitizeText(record.short_description)}, ${sanitizeText(record.address)}, ${sanitizeText(record.city)}, ${sanitizeText(record.city_slug)}, ${sanitizeText(record.state)}, ${sanitizeText(record.zip || record.postcode)}, ${sanitizeText(record.phone)}, ${sanitizeText(record.website)}, ${sanitizeText(record.email)}, ${sanitizeNum(record.rating)}, ${sanitizeNum(record.review_count)}, ${sanitizeText(record.price_range)}, ${sanitizeNum(record.price_min)}, ${sanitizeNum(record.price_max)}, ${sanitizeBool(record.transparent_pricing)}, ${sanitizeBool(record.grooms_cats)}, ${sanitizeBool(record.accepts_new_clients)}, ${sanitizeText(record.waitlist_status)}, ${sanitizeArrayText(record.services)}, ${sanitizeArrayText(record.service_categories)}, ${sanitizeArrayText(record.pet_types)}, ${sanitizeJsonArray(formattedHours)}, ${sanitizeArrayText(record.images)}, ${sanitizeArrayText(record.badges)}, ${sanitizeBool(record.is_featured)}, ${sanitizeBool(record.is_paw_verified)}, ${sanitizeBool(record.is_best_in_show)}, ${sanitizeNum(record.year_established)}, ${sanitizeNum(record.team_size)}, ${sanitizeArrayText(record.specialties)}, ${sanitizeArrayText(record.breeds)}, ${sanitizeNum(record.lat)}, ${sanitizeNum(record.lng)}, ${sanitizeText(record.booking_url)})`;
    });

    const columns = `id, slug, name, description, short_description, address, city, city_slug, state, zip, phone, website, email, rating, review_count, price_range, price_min, price_max, transparent_pricing, grooms_cats, accepts_new_clients, waitlist_status, services, service_categories, pet_types, hours, images, badges, is_featured, is_paw_verified, is_best_in_show, year_established, team_size, specialties, breeds, lat, lng, booking_url`;

    const conflictUpdate = `ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, short_description = EXCLUDED.short_description, address = EXCLUDED.address, city = EXCLUDED.city, city_slug = EXCLUDED.city_slug, state = EXCLUDED.state, zip = EXCLUDED.zip, phone = EXCLUDED.phone, website = EXCLUDED.website, email = EXCLUDED.email, rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, price_range = EXCLUDED.price_range, price_min = EXCLUDED.price_min, price_max = EXCLUDED.price_max, transparent_pricing = EXCLUDED.transparent_pricing, grooms_cats = EXCLUDED.grooms_cats, accepts_new_clients = EXCLUDED.accepts_new_clients, waitlist_status = EXCLUDED.waitlist_status, services = EXCLUDED.services, service_categories = EXCLUDED.service_categories, pet_types = EXCLUDED.pet_types, hours = EXCLUDED.hours, images = EXCLUDED.images, badges = EXCLUDED.badges, is_featured = EXCLUDED.is_featured, is_paw_verified = EXCLUDED.is_paw_verified, is_best_in_show = EXCLUDED.is_best_in_show, year_established = EXCLUDED.year_established, team_size = EXCLUDED.team_size, specialties = EXCLUDED.specialties, breeds = EXCLUDED.breeds, lat = EXCLUDED.lat, lng = EXCLUDED.lng, booking_url = EXCLUDED.booking_url`;

    // Write in batches of 50
    for (let i = 0; i < listingVals.length; i += 50) {
        const batch = listingVals.slice(i, i + 50);
        const sql = `INSERT INTO public.business_listings (${columns})\nVALUES\n${batch.join(',\n')}\n${conflictUpdate};\n`;
        fs.writeFileSync(`./data/seed_listings_${(i / 50) + 1}.sql`, sql);
    }
}

generateSqls();
