const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync(__dirname + '/../.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

function makeReq(options, body) {
  return new Promise((resolve, reject) => {
    const r = https.request(options, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        console.log('  -> HTTP', res.statusCode, '| body:', d.length, 'bytes');
        resolve({ status: res.statusCode, data: d });
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  // Step 1: Load from Supabase
  const sbUrl = new URL('/rest/v1/business_listings?select=id,name,city,state&order=name&limit=3', env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('1. Loading from Supabase...');
  const sbRes = await makeReq({
    hostname: sbUrl.hostname, port: 443, path: sbUrl.pathname + sbUrl.search, method: 'GET',
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  });
  const listings = JSON.parse(sbRes.data);
  console.log('   Loaded', listings.length, 'listings\n');

  // Step 2: Google Places for each
  for (const l of listings) {
    console.log('2. Google Places:', l.name, '(' + l.city + ', ' + l.state + ')');
    const body = JSON.stringify({ textQuery: l.name + ' ' + l.city + ' ' + l.state + ' pet grooming', maxResultCount: 1 });
    const gRes = await makeReq({
      hostname: 'places.googleapis.com', path: '/v1/places:searchText', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.location,places.businessStatus,places.googleMapsUri',
        'Content-Length': Buffer.byteLength(body),
      }
    }, body);
    if (gRes.data && gRes.status === 200) {
      const parsed = JSON.parse(gRes.data);
      const p = parsed.places && parsed.places[0];
      if (p) console.log('   Matched:', p.displayName.text, '| rating:', p.rating, '| reviews:', p.userRatingCount);
      else console.log('   No match');
    } else {
      console.log('   FAILED - raw:', gRes.data.slice(0, 200));
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log('\nDone!');
}
main().catch(console.error);
