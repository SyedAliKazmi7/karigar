"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Profile = {
  full_name: string | null;
  phone: string | null;
  role: "customer" | "dispatcher" | "admin";
};

export type ProviderInfo = {
  id: number;
  full_name: string;
  status: "pending" | "verified" | "suspended";
  available: boolean;
  avg_rating: number | null;
  jobs_completed: number;
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  provider: ProviderInfo | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProvider: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  provider: null,
  loading: true,
  signOut: async () => {},
  refreshProvider: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProvider = useCallback(async () => {
    const { data } = await supabase.rpc("my_provider");
    const row = (Array.isArray(data) ? data[0] : null) as ProviderInfo | null;
    setProvider(row ?? null);
  }, []);

  useEffect(() => {
    async function load(u: User | null) {
      setUser(u);
      if (u) {
        const [p] = await Promise.all([
          supabase.from("profiles").select("full_name, phone, role").eq("id", u.id).maybeSingle(),
          refreshProvider(),
        ]);
        setProfile((p.data as Profile | null) ?? null);
      } else {
        setProfile(null);
        setProvider(null);
      }
      setLoading(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshProvider]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, provider, loading, signOut, refreshProvider }}>
      {children}
    </AuthContext.Provider>
  );
}