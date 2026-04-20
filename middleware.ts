import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const isProtectedRoute = (pathname: string) =>
  pathname.startsWith('/dashboard') || pathname.startsWith('/admin')

export async function middleware(request: NextRequest) {
  // Refreshes the session cookie — MUST be first, no Prisma here (Edge runtime)
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // Non-protected routes: just refresh cookies and pass through
  if (!isProtectedRoute(pathname)) return supabaseResponse

  // Unauthenticated → sign-in
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Authenticated + protected route: let the page handle role/status checks
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
