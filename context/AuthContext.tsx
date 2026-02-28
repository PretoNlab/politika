import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as Sentry from '@sentry/react';
import posthog from '../lib/posthog';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check if there's a code in the URL (PKCE)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        console.log('[AuthContext] Code detected in URL, exchanging...');
        try {
          await supabase.auth.exchangeCodeForSession(code);
          // Remove code from URL to clean up
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('[AuthContext] Code exchange error:', err);
        }
      }

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Sentry.setUser({ id: session.user.id, email: session.user.email });
        posthog.identify(session.user.id, {
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
        });
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Sentry.setUser({ id: session.user.id, email: session.user.email });
        posthog.identify(session.user.id, {
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
        });
        if (event === 'SIGNED_IN') {
          posthog.capture('login_completed', {
            method: 'email',
            user_id: session.user.id,
          });
        }
      } else {
        Sentry.setUser(null);
        posthog.reset();
        if (event === 'SIGNED_OUT') {
          posthog.capture('logout_completed');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // Determine the correct redirect URL
    // We hardcode the production one to ensure exact match with Supabase whitelist
    const isProd = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    // Ensure we match the Supabase whitelist exactly (no trailing slashes if not in whitelist)
    const redirectUrl = isProd
      ? 'https://iapolitika.com.br/auth/callback'
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) return { error: error.message };
    posthog.capture('signup_completed', {
      method: 'email',
      source: 'app',
    });
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
