import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Supabase JS client cannot execute raw DDL (CREATE/ALTER tables).
    // The only way to execute raw SQL from the JS client without an RPC 
    // is if an RPC exists to execute it. 
    // We will instead use the management API endpoint or just instruct the user 
    // since this is a schema migration. Let's return the SQL they need to run.

    const sql = `
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' NOT NULL;
ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can update their own listings" ON public.business_listings;
CREATE POLICY "Owners can update their own listings" ON public.business_listings FOR UPDATE USING (auth.uid() = owner_id);
  `;

    return NextResponse.json({
        message: "Cannot run raw DDL via JS Client. Please run this in the Supabase SQL Editor:",
        sql
    });
}
