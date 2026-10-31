"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Profile = {
  full_name: string | null;
  phone: string | null;
  role: "customer" | "dispatcher" | "admin";
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(u: User | null) {
      setUser(u);
      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", u.id)
          .maybeSingle();
        setProfile((data as Profile | null) ?? null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}