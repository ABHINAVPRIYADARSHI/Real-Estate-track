import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const isProtectedRoute = (pathname: string) =>
  pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  // If accessing a protected route, ensure user is authenticated
  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Check user status via the API route (runs on Node, can use Prisma)
    const cookie = request.headers.get("cookie") ?? "";
    const statusRes = await fetch(
      `${request.nextUrl.origin}/api/user-status`,
      {
        headers: { cookie },
        cache: "no-store",
      }
    );

    if (!statusRes.ok) {
      return NextResponse.redirect(new URL("/blocked/pending", request.url));
    }

    const { status } = (await statusRes.json()) as { status: string };

    if (status === "Pending") {
      return NextResponse.redirect(new URL("/blocked/pending", request.url));
    }

    if (status === "Suspended") {
      return NextResponse.redirect(new URL("/blocked/suspended", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
