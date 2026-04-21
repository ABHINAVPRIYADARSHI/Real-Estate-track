'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { registerUserAction } from '@/actions/registerUser'

export default function SignInPage() {
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [oauthLoading, setOauthLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Hard redirect so the root layout server component re-renders with the
      // authenticated user's SideNav (client-side nav keeps the stale null render).
      if (user) window.location.href = '/dashboard'
    })
  }, [])

  async function signInWithGoogle() {
    setOauthLoading(true)
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setEmailLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      })

      if (signUpError) {
        setError(signUpError.message)
        setEmailLoading(false)
        return
      }

      // Create the public.User profile row so admin can manage the account
      const authId = data.user?.id
      if (authId) {
        try {
          await registerUserAction({ authId, email, displayName })
        } catch {
          // Non-fatal: profile creation failed, admin can manually fix
          console.error('Could not create user profile after sign-up')
        }
      }

      setSuccessMsg('Account created! You may proceed to sign in.')
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
      } else {
        window.location.href = '/dashboard'
      }
    }

    setEmailLoading(false)
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setSuccessMsg(null)
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-brand-tertiary p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-white mb-2">Welcome to Aarya Hub</h1>
        <p className="text-sm text-white/60 mb-6">
          {mode === 'signin' ? 'Sign in to continue' : 'Create a new account'}
        </p>

        {/* Google OAuth */}
        <button
          onClick={signInWithGoogle}
          disabled={oauthLoading || emailLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow hover:bg-neutral-100 disabled:opacity-60 transition-all"
        >
          <GoogleIcon />
          {oauthLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {/* Display Name — only shown on sign-up */}
          {mode === 'signup' && (
            <input
              type="text"
              required
              placeholder="Full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition"
            />
          )}

          <input
            type="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition"
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
          {successMsg && (
            <p className="text-xs text-green-400 bg-green-400/10 rounded-lg px-3 py-2">{successMsg}</p>
          )}

          <button
            type="submit"
            disabled={emailLoading || oauthLoading}
            className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition-all"
          >
            {emailLoading
              ? mode === 'signup' ? 'Creating account...' : 'Signing in...'
              : mode === 'signup' ? 'Create Account' : 'Sign In with Email'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-5 text-center text-xs text-white/40">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-white/70 hover:text-white underline transition"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
