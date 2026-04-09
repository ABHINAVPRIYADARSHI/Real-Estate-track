import { PrismaClient } from "@prisma/client";
import { loadProjectEnv } from "./_env.mjs";

const env = loadProjectEnv();

if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env.local or .env before running make-admin."
  );
}

process.env.DATABASE_URL = env.DATABASE_URL;

const clerkUserId = process.argv[2];
const displayName = process.argv[3] ?? null;

if (!clerkUserId) {
  throw new Error(
    "Usage: npm run make-admin -- <clerkUserId> [displayName]"
  );
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      displayName,
      role: "Admin",
      status: "Active",
    },
    update: {
      role: "Admin",
      status: "Active",
      managerId: null,
      ...(displayName ? { displayName } : {}),
    },
    select: {
      id: true,
      clerkUserId: true,
      displayName: true,
      role: true,
      status: true,
    },
  });

  console.log("Admin user ready:");
  console.log(JSON.stringify(user, null, 2));
} finally {
  await prisma.$disconnect();
}
