import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

// status: 'loading' | 'anon' | 'authorized' | 'denied' | 'error'
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) handle(data.session) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => handle(s))
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  async function handle(s) {
    setSession(s)
    if (!s) { setProfile(null); setStatus('anon'); return }
    try {
      // Google proves identity; the allowlist (profiles) decides access.
      await supabase.rpc('link_my_profile')
      const { data, error } = await supabase
        .from('profiles').select('*')
        .eq('auth_uid', s.user.id).eq('is_active', true).maybeSingle()
      if (error) throw error
      if (data) { setProfile(data); setError(null); setStatus('authorized') }
      else { setProfile(null); setStatus('denied') }
    } catch (e) {
      // A transient failure must not be mistaken for "no access".
      setProfile(null); setError(e.message || 'Could not verify your access.'); setStatus('error')
    }
  }

  const signIn = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) setError(error.message || 'Sign-in could not start. Please try again.')
  }
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthCtx.Provider value={{ session, profile, status, error, isManager: profile?.role === 'manager', signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
