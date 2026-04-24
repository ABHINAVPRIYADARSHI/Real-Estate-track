import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not authenticated, treat as Pending (middleware will still redirect).
  if (!user) {
    return NextResponse.json({ status: "Pending", role: null });
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { status: true, role: true },
  });

  if (dbUser) {
    return NextResponse.json({
      status: dbUser.status,
      role: dbUser.role,
    });
  }

  // If the user record doesn't exist yet, create a Pending record.
  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    null;

  await prisma.user.create({
    data: {
      authId: user.id,
      displayName,
      email: user.email ?? null,
      // role is intentionally unset until an Admin approves.
      // status defaults to Pending.
    },
  });

  return NextResponse.json({ status: "Pending", role: null });
}
