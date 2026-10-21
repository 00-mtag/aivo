import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Ctx = { session: Session | null; profile: any; loading: boolean; refresh: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ session: null, profile: null, loading: true, refresh: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Loads the profile. If the row is missing, creates it so the app never spins forever.
  const load = useCallback(async (s: Session | null) => {
    if (!s) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle();
    if (error) console.log('profile load error:', error.message);
    if (data) { setProfile(data); return; }
    const { data: created, error: e2 } = await supabase.from('profiles').upsert({ id: s.user.id }).select().single();
    if (e2) console.log('profile create error:', e2.message);
    setProfile(created);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      let s = data.session;
      // Cold start (app was closed and reopened): if onboarding was never finished,
      // forget the saved login so the user starts at the login screen.
      if (s) {
        const { data: p, error } = await supabase.from('profiles').select('onboarded').eq('id', s.user.id).maybeSingle();
        if (!error && !p?.onboarded) {
          await supabase.auth.signOut({ scope: 'local' });
          s = null;
        }
      }
      setSession(s); await load(s); setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setTimeout(() => load(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return (
    <AuthCtx.Provider value={{ session, profile, loading, refresh: () => load(session) }}>
      {children}
    </AuthCtx.Provider>
  );
}
