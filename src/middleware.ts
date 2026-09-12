import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const protectedRoute = /^\/(dashboard|admin|claim|login|signup|auth)(?:\/|$)/.test(request.nextUrl.pathname)
    if (protectedRoute) return await updateSession(request)
    const headers = new Headers(request.headers)
    headers.delete('x-sbx-public-view')
    if (request.nextUrl.searchParams.get('sbx-public') === '1') headers.set('x-sbx-public-view', '1')
    return NextResponse.next({request:{headers}})
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/claim/:path*',
        '/login',
        '/signup',
        '/auth/:path*',
        { source: '/((?!api|_next/static|_next/image|favicon.ico).*)', has: [{type:'query',key:'sbx-public',value:'1'}] },
    ],
}
