// Loaded via `--import` before any test file. Modules such as src/lib/supabase/client.ts
// read these at import time; no network call is made unless a query is executed.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
