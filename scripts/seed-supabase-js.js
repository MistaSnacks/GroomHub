require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function plainSlug(slug) {
    return String(slug).replace(/-(wa|or)$/i, '');
}

function stateAwareCitySlug(citySlug, state) {
    return `${plainSlug(citySlug)}-${String(state).toLowerCase()}`;
}

async function seedListings() {
    const dataRaw = fs.readFileSync('./data/groomers_enriched.json', 'utf8');
    const records = JSON.parse(dataRaw);
    console.log(`Found ${records.length} records to process.`);

    // Prepare cities
    const uniqueCitiesMap = new Map();
    const unknownCityListings = [];
    for (const record of records) {
        const state = record.state || 'WA';
        if (!record.city || record.city === 'Unknown') {
            unknownCityListings.push(record.slug || record.name || 'unknown-record');
            continue;
        }
        let cityRaw = record.city;
        let citySlug = record.city_slug || cityRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const cityRecordSlug = stateAwareCitySlug(citySlug, state);
        uniqueCitiesMap.set(cityRecordSlug, {
            slug: cityRecordSlug,
            name: cityRaw,
            state: state,
            state_abbr: state,
            groomer_count: 0,
            image: '',
            description: ''
        });
    }

    if (unknownCityListings.length > 0) {
        console.warn(`Skipping ${unknownCityListings.length} city upserts with missing city data.`);
    }

    const citiesArray = Array.from(uniqueCitiesMap.values());
    console.log(`Upserting ${citiesArray.length} cities...`);
    const { error: cityError } = await supabase
        .from('cities')
        .upsert(citiesArray, { onConflict: 'slug' });

    if (cityError) {
        console.error('Error upserting cities:', cityError.message);
    }

    // Prepare listings
    const listings = records.map(record => {
        let formattedHours = [];
        if (record.hours && typeof record.hours === 'object') formattedHours = [record.hours];

        const generatedSlug = record.slug || record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `unknown-${Math.random()}`;

        return {
            id: generatedSlug,
            slug: generatedSlug,
            name: record.name || 'Unknown',
            description: record.description || '',
            short_description: record.short_description || '',
            address: record.address || '',
            city: record.city || 'Unknown',
            city_slug: record.city_slug || (record.city ? record.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'unknown'),
            state: record.state || 'WA',
            zip: record.zip || record.postcode || '',
            phone: record.phone || '',
            website: record.website || null,
            email: record.email || null,
            rating: record.rating ? Number(record.rating) : null,
            review_count: record.review_count ? Number(record.review_count) : null,
            price_range: record.price_range || 'N/A',
            price_min: record.price_min ? Number(record.price_min) : 0,
            price_max: record.price_max ? Number(record.price_max) : 0,
            transparent_pricing: Boolean(record.transparent_pricing),
            grooms_cats: Boolean(record.grooms_cats),
            accepts_new_clients: Boolean(record.accepts_new_clients),
            waitlist_status: record.waitlist_status || null,
            services: record.services || [],
            service_categories: record.service_categories || [],
            pet_types: record.pet_types || [],
            hours: formattedHours,
            images: record.images || [],
            badges: record.badges || [],
            is_featured: Boolean(record.is_featured),
            is_paw_verified: Boolean(record.is_paw_verified),
            is_best_in_show: Boolean(record.is_best_in_show),
            year_established: record.year_established ? Number(record.year_established) : null,
            team_size: record.team_size ? Number(record.team_size) : null,
            specialties: record.specialties || [],
            breeds: record.breeds || [],
            lat: record.lat ? Number(record.lat) : null,
            lng: record.lng ? Number(record.lng) : null,
            booking_url: record.booking_url || null
        };
    });

    // Batch insert
    const batchSize = 50;
    let successCount = 0;
    for (let i = 0; i < listings.length; i += batchSize) {
        const batch = listings.slice(i, i + batchSize);
        console.log(`Inserting batch ${i / batchSize + 1} (${batch.length} records)...`);
        const { data, error } = await supabase
            .from('business_listings')
            .upsert(batch, { onConflict: 'slug' })
            .select();

        if (error) {
            console.error('Error inserting batch:', error.message);
        } else {
            successCount += data.length;
        }
    }

    console.log(`Successfully upserted ${successCount} business_listings.`);
}

seedListings().catch(console.error);
