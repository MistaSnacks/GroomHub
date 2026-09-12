import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Retry transient read failures only. Never retry writes or authentication here.
const readFetch: typeof fetch = async (input, init) => {
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  if (method.toUpperCase() !== "GET") return fetch(input, init);
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(input, init);
    if (![502, 503, 504].includes(response.status) || attempt === 2) return response;
    await response.body?.cancel();
    await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: readFetch },
});

