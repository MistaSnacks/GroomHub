import { NextResponse } from "next/server";
import { getAllCitiesWithCounts } from "@/lib/supabase/queries";

export async function GET() {
  const cities = await getAllCitiesWithCounts();
  return NextResponse.json(cities);
}
