import { PrismaClient } from "@prisma/client";
import { loadProjectEnv } from "./_env.mjs";

const env = loadProjectEnv();

if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Add it to .env.local or .env before running make-admin."
  );
}

process.env.DATABASE_URL = env.DATABASE_URL;

// authId is the Supabase user UUID (from auth.users).
// You can get it from Supabase Dashboard > Authentication > Users.
const authId = process.argv[2];
const displayName = process.argv[3] ?? null;

if (!authId) {
  throw new Error(
    "Usage: npm run make-admin -- <supabaseAuthId> [displayName]\n" +
    "  supabaseAuthId: The UUID from Supabase > Authentication > Users"
  );
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.upsert({
    where: { authId },
    create: {
      authId,
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
      authId: true,
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
