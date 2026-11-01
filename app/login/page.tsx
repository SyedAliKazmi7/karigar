"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const input =
  "h-[50px] w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";
const label = "mb-1.5 mt-4 block text-sm font-bold";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("registered");
    if (r === "1") setNotice("Account created. Please log in with your email and password.");
    if (r === "confirm") setNotice("Account created. Please check your email to confirm, then log in.");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) return setError("Wrong email or password.");
    router.push("/");
  }

  return (
    <main className="auth-bg min-h-[calc(100vh-76px)] px-5 py-12 sm:px-8 sm:py-16">
      <div className="anim-up mx-auto max-w-md rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl backdrop-blur lg:ml-[8%] lg:mr-auto">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted">Log in to manage your requests.</p>

        {notice && (
          <p role="status" className="mt-5 rounded-xl bg-brand-light p-3 text-sm font-semibold text-brand">
            {notice}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />

          <label htmlFor="password" className={label}>Password</label>
          <input id="password" type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 h-[50px] w-full rounded-xl bg-brand font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? (<><span className="spinner spinner-sm" />Logging in...</>) : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New to Karigar?{" "}
          <Link href="/signup" className="font-bold text-brand hover:underline">Create an account</Link>
        </p>
      </div>
    </main>
  );
}