"use server";

import { prisma } from "@/lib/prisma";

/**
 * Called immediately after supabase.auth.signUp() succeeds on the client.
 * Creates the corresponding public.User row so the admin can assign a role
 * and activate the account. Status defaults to "Pending" (schema default).
 *
 * Idempotent: if a row for this authId already exists, it's a no-op.
 */
export async function registerUserAction(input: {
  authId: string;
  email: string;
  displayName: string;
}) {
  const { authId, email, displayName } = input;

  // Guard: skip if this auth user already has a profile row (e.g. OAuth flow)
  const existing = await prisma.user.findUnique({ where: { authId } });
  if (existing) return { ok: true, existed: true };

  await prisma.user.create({
    data: {
      authId,
      email,
      displayName: displayName.trim() || null,
    },
  });

  return { ok: true, existed: false };
}
