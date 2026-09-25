require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFetch() {
    const { data, error } = await supabase.from('business_listings').select('*').limit(5);
    console.log("Error:", error);
    console.log("Data length:", data ? data.length : 0);
    if (data && data.length > 0) {
        console.log("First item id:", data[0].id);
    }
}

testFetch();
