import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type AuthenticatedUser = {
  supabaseId: string
  dbUserId: string
  role: string | null
  status: string
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Not authenticated')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, role: true, status: true },
  })

  if (!dbUser) throw new Error('User record not found')

  return {
    supabaseId: user.id,
    dbUserId: dbUser.id,
    role: dbUser.role,
    status: dbUser.status,
  }
}
