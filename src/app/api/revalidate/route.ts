import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

function authorized(req: Request) {
  const expected = process.env.REVALIDATION_SECRET;
  const supplied = req.headers.get("x-revalidation-secret") ?? req.headers.get("x-revalidate-secret");
  return !!expected && !!supplied && Buffer.byteLength(expected) === Buffer.byteLength(supplied)
    && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
const headers = { "Cache-Control": "no-store" };
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ok:false},{status:401,headers});
  return NextResponse.json({ok:true,snackbox:{revalidate:1,visualEditing:1},cms:{project:"groomlocal",blogPost:1,homePage:1,page:1}},{headers});
}
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ok:false},{status:401,headers});
  let body: {paths?: unknown; tags?: unknown};
  try { body = await req.json(); } catch { return NextResponse.json({ok:false},{status:400,headers}); }
  if (!body || typeof body !== "object" ||
      (body.paths !== undefined && (!Array.isArray(body.paths) || !body.paths.every(p=>typeof p === "string" && /^\/(?!\/)/.test(p)))) ||
      (body.tags !== undefined && (!Array.isArray(body.tags) || !body.tags.every(t=>typeof t === "string" && t.startsWith("sbx:groomlocal"))))) {
    return NextResponse.json({ok:false},{status:400,headers});
  }
  const paths = [...new Set([...(body.paths as string[] || []), "/blog", "/blog/feed.xml", "/sitemap/0.xml"])];
  // Referenced author/topic/media changes also affect article cards and metadata.
  const tags = [...new Set([...(body.tags as string[] || []), "sbx:groomlocal"])];
  for (const tag of tags) revalidateTag(tag,{expire:0});
  for (const path of paths) revalidatePath(path);
  return NextResponse.json({ok:true,revalidated:paths,tags},{headers});
}
