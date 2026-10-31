"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const input =
  "h-[50px] w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";
const label = "mb-1.5 mt-4 block text-sm font-bold";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^03\d{9}$/.test(form.phone.trim()))
      return setError("Enter a valid mobile number, for example 03001234567.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.name.trim(), phone: form.phone.trim() } },
    });
    setBusy(false);

    if (error) return setError(error.message);
    if (data.session) router.push("/");
    else setInfo("Account created. Please check your email to confirm, then log in.");
  }

  return (
    <main className="auth-bg min-h-[calc(100vh-76px)] px-5 py-12 sm:px-8 sm:py-16">
      <div className="anim-up mx-auto max-w-md rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl backdrop-blur lg:ml-[8%] lg:mr-auto">
        <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-muted">Post jobs and compare offers from verified professionals.</p>

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="name" className={label}>Full name</label>
          <input id="name" className={input} value={form.name} onChange={set("name")} autoComplete="name" />

          <label htmlFor="phone" className={label}>Mobile number</label>
          <input id="phone" className={input} value={form.phone} onChange={set("phone")} placeholder="03001234567" inputMode="numeric" autoComplete="tel" />

          <label htmlFor="email" className={label}>Email</label>
          <input id="email" type="email" className={input} value={form.email} onChange={set("email")} autoComplete="email" />

          <label htmlFor="password" className={label}>Password</label>
          <input id="password" type="password" className={input} value={form.password} onChange={set("password")} autoComplete="new-password" />
          <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>

          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          {info && <p className="mt-4 rounded-xl bg-brand-light p-3 text-sm font-semibold text-brand">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 h-[50px] w-full rounded-xl bg-brand font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? (<><span className="spinner spinner-sm" />Creating account...</>) : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}