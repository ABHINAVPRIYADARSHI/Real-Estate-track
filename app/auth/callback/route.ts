import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    console.error('[auth/callback] No code in URL')
    return NextResponse.redirect(`${origin}/sign-in?error=no_code`)
  }

  const supabase = await createServerSupabaseClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] Exchange error:', exchangeError.message)
    return NextResponse.redirect(`${origin}/sign-in?error=exchange_failed`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[auth/callback] getUser error:', userError?.message)
    return NextResponse.redirect(`${origin}/sign-in?error=no_user`)
  }

  console.log('[auth/callback] Supabase user:', user.id, user.email)

  try {
    // Check if DB record exists
    const existing = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, status: true },
    })

    console.log('[auth/callback] DB lookup result:', existing)

    if (!existing) {
      console.log('[auth/callback] Creating new Pending user for:', user.id)
      const created = await prisma.user.create({
        data: {
          authId: user.id,
          displayName: user.user_metadata?.full_name ?? null,
          email: user.email ?? null,
        },
      })
      console.log('[auth/callback] Created user:', created.id)
      return NextResponse.redirect(`${origin}/blocked/pending`)
    }

    if (existing.status === 'Pending') {
      return NextResponse.redirect(`${origin}/blocked/pending`)
    }

    if (existing.status === 'Suspended') {
      return NextResponse.redirect(`${origin}/blocked/suspended`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  } catch (err: any) {
    console.error('[auth/callback] Prisma error:', err?.message ?? err)
    // Still redirect to dashboard — the page will handle the "not found" case
    return NextResponse.redirect(`${origin}/sign-in?error=db_error&msg=${encodeURIComponent(err?.message ?? 'unknown')}`)
  }
}
