"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function useStaff() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isStaff = profile?.role === "admin" || profile?.role === "dispatcher";

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!isStaff) router.replace("/");
  }, [loading, user, isStaff, router]);

  return { ready: !loading && !!user && isStaff };
}