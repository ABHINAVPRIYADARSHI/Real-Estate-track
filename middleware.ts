import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Middleware runs on the edge, so we call a small Node route to read Prisma.
  const cookie = req.headers.get("cookie") ?? "";
  const statusRes = await fetch(
    `${req.nextUrl.origin}/api/user-status`,
    {
      headers: { cookie },
      cache: "no-store",
    }
  );

  if (!statusRes.ok) {
    return NextResponse.redirect(new URL("/blocked/pending", req.url));
  }

  const { status } = (await statusRes.json()) as { status: string };

  if (status === "Pending") {
    return NextResponse.redirect(
      new URL("/blocked/pending", req.url)
    );
  }

  if (status === "Suspended") {
    return NextResponse.redirect(
      new URL("/blocked/suspended", req.url)
    );
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

