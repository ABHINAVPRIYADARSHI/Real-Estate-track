import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();

  // If user is not authenticated, treat as Pending (middleware will still redirect).
  if (!userId) {
    return NextResponse.json({ status: "Pending", role: null });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { status: true, role: true },
  });

  if (user) {
    return NextResponse.json({
      status: user.status,
      role: user.role,
    });
  }

  // If the user record doesn't exist yet, create a Pending record.
  const clerkUser = await currentUser();
  await prisma.user.create({
    data: {
      clerkUserId: userId,
      displayName: clerkUser?.fullName ?? null,
      // role is intentionally unset until an Admin approves.
      // status defaults to Pending.
    },
  });

  return NextResponse.json({ status: "Pending", role: null });
}

