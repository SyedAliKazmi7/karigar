"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/AuthProvider";

type Cat = { id: number; name: string };

const input =
  "h-[50px] w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";
const label = "mb-1.5 mt-5 block text-sm font-bold";
const card =
  "anim-up relative mx-auto max-w-xl rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl backdrop-blur lg:ml-[8%] lg:mr-auto";

export default function JoinPage() {
  const { user, profile, provider, loading, refreshProvider } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [areas, setAreas] = useState("");
  const [exp, setExp] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [trap, setTrap] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .eq("active", true)
      .order("id")
      .then(({ data }) => setCats((data ?? []) as Cat[]));
  }, []);

  useEffect(() => {
    if (profile && !prefilled) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setPrefilled(true);
    }
  }, [profile, prefilled]);

  function toggle(id: number) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (trap) return setDone(true);
    if (name.trim().length < 2) return setError("Please enter your full name.");
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "92" + digits.slice(1);
    if (!/^92\d{10}$/.test(digits)) return setError("Enter a valid WhatsApp number, for example 03001234567.");
    if (picked.length === 0) return setError("Choose at least one service.");
    const years = exp.trim() === "" ? null : Number(exp);
    if (years !== null && (!Number.isInteger(years) || years < 0 || years > 60))
      return setError("Experience must be a whole number of years.");
    if (!user) {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email address.");
      if (password.length < 8) return setError("Password must be at least 8 characters.");
    }

    setBusy(true);

    if (!user) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim(), phone: phone.trim() } },
      });
      if (error) {
        setBusy(false);
        return setError(
          error.message.toLowerCase().includes("already")
            ? "This email already has an account. Please log in first, then apply."
            : error.message
        );
      }
      if (!data.session) {
        setBusy(false);
        return setInfo("Account created. Please confirm your email, log in, and then apply again from this page.");
      }
    }

    const { error } = await supabase.rpc("apply_as_provider", {
      p_name: name.trim(),
      p_whatsapp: digits,
      p_areas: areas.split(",").map((a) => a.trim()).filter(Boolean),
      p_years: years,
      p_category_ids: picked,
    });
    setBusy(false);

    if (error) {
      const m = error.message;
      if (m.includes("already applied")) return setError("You have already applied. Check your provider profile.");
      if (m.includes("already registered"))
        return setError("This WhatsApp number is already registered. Please contact support.");
      if (m.includes("Too many applications"))
        return setError("Too many applications right now. Please try again in a little while.");
      return setError("Sorry, something went wrong. Please try again.");
    }
    await refreshProvider();
    setDone(true);
  }

  if (loading) {
    return (
      <main className="auth-bg min-h-[calc(100vh-76px)]">
        <div className="loader-wrap" role="status" aria-label="Loading">
          <span className="spinner" style={{ borderTopColor: "#fff" }} />
        </div>
      </main>
    );
  }

  return (
    <main className="auth-bg min-h-[calc(100vh-76px)] px-5 py-12 sm:px-8 sm:py-14">
      <div className={card}>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-3xl text-brand">
              ✓
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Application received</h1>
            <p className="mt-3 text-muted">
              Thank you. Our team will contact you on WhatsApp to verify your details. After
              verification you can see jobs and send offers from your provider dashboard.
            </p>
            <Link href="/provider" className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white">
              Go to my provider profile
            </Link>
          </div>
        ) : provider ? (
          <div className="py-4 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">You are already registered</h1>
            <p className="mt-3 text-muted">
              Your professional profile is <span className="font-bold text-ink">{provider.status}</span>.
            </p>
            <Link href="/provider" className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white">
              Open provider dashboard
            </Link>
          </div>
        ) : (
          <>
            <span className="rounded-full bg-[#d9efe8] px-3.5 py-1.5 text-xs font-bold text-[#0a4a40]">
              For professionals
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Join Karigar</h1>
            <p className="mt-2 text-muted">
              Get jobs near you and send your own price. Our team verifies every professional.
            </p>
            {!user && (
              <p className="mt-2 text-sm text-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-brand hover:underline">Log in first</Link>
              </p>
            )}

            <form onSubmit={onSubmit} noValidate>
              <label htmlFor="n" className={label}>Full name</label>
              <input id="n" className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />

              <label htmlFor="p" className={label}>WhatsApp number</label>
              <input id="p" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" inputMode="numeric" autoComplete="tel" />

              {!user && (
                <>
                  <label htmlFor="em" className={label}>Email (for your login)</label>
                  <input id="em" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />

                  <label htmlFor="pw" className={label}>Password</label>
                  <input id="pw" type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>
                </>
              )}

              <p className={label}>Your services</p>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => {
                  const on = picked.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggle(c.id)}
                      aria-pressed={on}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                        on ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-muted hover:border-gray-400"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>

              <label htmlFor="a" className={label}>Areas you work in (separate with commas)</label>
              <input id="a" className={input} value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Bahria Greens, DHA, Gulberg" />

              <label htmlFor="e" className={label}>Years of experience (optional)</label>
              <input id="e" className={input} value={exp} onChange={(e) => setExp(e.target.value)} inputMode="numeric" />

              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input id="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
              </div>

              {error && <p className="mt-5 text-sm font-semibold text-red-600">{error}</p>}
              {info && <p className="mt-5 rounded-xl bg-brand-light p-3 text-sm font-semibold text-brand">{info}</p>}

              <button
                type="submit"
                disabled={busy}
                className="mt-7 h-[52px] w-full rounded-xl bg-accent font-bold text-[#2a1a00] transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                {busy ? (<><span className="spinner spinner-sm" />Sending...</>) : "Submit application"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}