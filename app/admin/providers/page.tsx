"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useStaff } from "../../../components/useStaff";
import { timeAgo } from "../../../lib/format";

type Cat = { id: number; name: string };
type Prov = {
  id: number;
  full_name: string;
  whatsapp: string;
  status: string;
  available: boolean;
  areas: string[];
  experience_years: number | null;
  avg_rating: number | null;
  jobs_completed: number;
  user_id: string | null;
  created_at: string;
  provider_categories: { category_id: number }[];
};

type Filter = "all" | "pending" | "verified" | "suspended";

const BADGE: Record<string, string> = {
  verified: "bg-[#d9efe8] text-[#0a4a40]",
  pending: "bg-[#fdefd0] text-[#6b4200]",
  suspended: "bg-red-100 text-red-700",
};
const RANK: Record<string, number> = { pending: 0, verified: 1, suspended: 2 };

const input =
  "h-[46px] w-full rounded-xl border border-gray-300 bg-white px-3 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";
const label = "mb-1.5 mt-4 block text-sm font-bold";

export default function ProvidersPage() {
  const { ready } = useStaff();
  const [cats, setCats] = useState<Cat[]>([]);
  const [provs, setProvs] = useState<Prov[] | null>(null);
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [areas, setAreas] = useState("");
  const [exp, setExp] = useState("");
  const [status, setStatus] = useState("verified");
  const [picked, setPicked] = useState<number[]>([]);

  const [linkFor, setLinkFor] = useState<number | null>(null);
  const [linkEmail, setLinkEmail] = useState("");

  const load = useCallback(async () => {
    const [c, p, a] = await Promise.all([
      supabase.from("categories").select("id, name").order("id"),
      supabase
        .from("providers")
        .select(
          "id, full_name, whatsapp, status, available, areas, experience_years, avg_rating, jobs_completed, user_id, created_at, provider_categories(category_id)"
        )
        .order("created_at", { ascending: false }),
      supabase.rpc("admin_provider_accounts"),
    ]);
    setCats((c.data ?? []) as Cat[]);
    if (p.error) setError(p.error.message);
    else setProvs((p.data ?? []) as unknown as Prov[]);
    const map: Record<number, string> = {};
    ((a.data ?? []) as { provider_id: number; email: string }[]).forEach((r) => (map[r.provider_id] = r.email));
    setEmails(map);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  function toggleCat(id: number) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function addProvider(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Enter the professional's name.");
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "92" + digits.slice(1);
    if (!/^92\d{10}$/.test(digits)) return setError("Enter a valid WhatsApp number, for example 03001234567.");
    if (picked.length === 0) return setError("Choose at least one service.");
    const years = exp.trim() === "" ? null : Number(exp);
    if (years !== null && (!Number.isInteger(years) || years < 0)) return setError("Experience must be a whole number of years.");

    setBusy(true);
    const { data, error } = await supabase
      .from("providers")
      .insert({
        full_name: name.trim(),
        whatsapp: digits,
        status,
        areas: areas.split(",").map((a) => a.trim()).filter(Boolean),
        experience_years: years,
      })
      .select("id")
      .single();
    if (error || !data) {
      setBusy(false);
      return setError(
        error?.code === "23505" ? "A professional with this WhatsApp number already exists." : error?.message ?? "Could not add professional."
      );
    }
    const { error: e2 } = await supabase
      .from("provider_categories")
      .insert(picked.map((category_id) => ({ provider_id: data.id, category_id })));
    setBusy(false);
    if (e2) return setError(e2.message);

    setName("");
    setPhone("");
    setAreas("");
    setExp("");
    setPicked([]);
    load();
  }

  async function update(id: number, patch: Partial<Pick<Prov, "status" | "available">>) {
    const { error } = await supabase.from("providers").update(patch).eq("id", id);
    if (error) setError(error.message);
    else load();
  }

  async function link(id: number) {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(linkEmail.trim()))
      return setError("Enter the email the professional used to create their account.");
    const { error } = await supabase.rpc("link_provider_account", { p_provider: id, p_email: linkEmail.trim() });
    if (error) return setError(error.message);
    setLinkFor(null);
    setLinkEmail("");
    load();
  }

  async function unlink(id: number) {
    if (!confirm("Remove the login from this professional? They will no longer see jobs in the app.")) return;
    const { error } = await supabase.rpc("unlink_provider_account", { p_provider: id });
    if (error) setError(error.message);
    else load();
  }

  if (!ready) {
    return (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }

  const catName = (id: number) => cats.find((c) => c.id === id)?.name ?? "";
  const all = provs ?? [];
  const counts = {
    all: all.length,
    pending: all.filter((p) => p.status === "pending").length,
    verified: all.filter((p) => p.status === "verified").length,
    suspended: all.filter((p) => p.status === "suspended").length,
  };
  const shown = all
    .filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9));

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <Link href="/admin" className="text-sm text-muted hover:text-brand">&larr; Dashboard</Link>
      <h1 className="anim-up mb-6 mt-2 text-4xl font-extrabold tracking-tight">Professionals</h1>
      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={addProvider} noValidate className="anim-up-2 h-fit rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-extrabold">Add a professional</h2>
          <p className="mt-1 text-sm text-muted">For professionals who work only on WhatsApp. You can link a login later.</p>

          <label htmlFor="pn" className={label}>Full name</label>
          <input id="pn" className={input} value={name} onChange={(e) => setName(e.target.value)} />

          <label htmlFor="pp" className={label}>WhatsApp number</label>
          <input id="pp" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" inputMode="numeric" />

          <label htmlFor="pa" className={label}>Areas (separate with commas)</label>
          <input id="pa" className={input} value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Bahria Greens, DHA" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pe" className={label}>Experience (years)</label>
              <input id="pe" inputMode="numeric" className={input} value={exp} onChange={(e) => setExp(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ps" className={label}>Status</label>
              <select id="ps" className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <p className={label}>Services</p>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCat(c.id)}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${
                    on ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-muted"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 h-[48px] w-full rounded-xl bg-accent font-bold text-[#2a1a00] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? (<><span className="spinner spinner-sm" />Adding...</>) : "Add professional"}
          </button>
        </form>

        <section className="anim-up-3">
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", "pending", "verified", "suspended"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 text-sm font-bold capitalize transition ${
                  filter === f ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-muted hover:border-gray-400"
                }`}
              >
                {f} ({counts[f]})
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {!provs && !error && (
              <div className="loader-inline" role="status" aria-label="Loading professionals">
                <span className="spinner" />
              </div>
            )}
            {provs && shown.length === 0 && (
              <p className="rounded-3xl border border-gray-200 bg-white p-8 text-muted">No professionals here.</p>
            )}

            {shown.map((p) => (
              <div
                key={p.id}
                className={`rounded-3xl border bg-white p-5 ${p.status === "pending" ? "border-[#f5a524]" : "border-gray-200"}`}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-lg font-bold">{p.full_name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${BADGE[p.status] ?? ""}`}>{p.status}</span>
                  {p.user_id ? (
                    <span className="rounded-full bg-[#d9efe8] px-3 py-1 text-xs font-bold text-[#0a4a40]">Has login</span>
                  ) : (
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600">WhatsApp only</span>
                  )}
                  {!p.available && (
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600">unavailable</span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted">
                  +{p.whatsapp}
                  {p.experience_years ? ` · ${p.experience_years} years` : ""}
                  {p.avg_rating ? ` · Rating ${p.avg_rating}` : ""}
                  {` · ${p.jobs_completed} jobs`}
                  {` · Added ${timeAgo(p.created_at)}`}
                </p>
                <p className="mt-1 text-sm">
                  {p.provider_categories.map((pc) => catName(pc.category_id)).filter(Boolean).join(", ") || "No services"}
                  {p.areas.length ? ` · ${p.areas.join(", ")}` : ""}
                </p>

                {p.user_id && (
                  <p className="mt-1 text-sm text-muted">Login: {emails[p.id] ?? "linked account"}</p>
                )}

                {p.status === "pending" && (
                  <p className="mt-3 rounded-xl bg-[#fdefd0] p-3 text-[13px] text-[#6b4200]">
                    Waiting for verification. Contact the professional on WhatsApp, check the details, then press Verify.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-bold">
                  {p.status !== "verified" && (
                    <button onClick={() => update(p.id, { status: "verified" })} className="text-brand hover:underline">Verify</button>
                  )}
                  {p.status !== "suspended" && (
                    <button onClick={() => update(p.id, { status: "suspended" })} className="text-red-600 hover:underline">Suspend</button>
                  )}
                  <button onClick={() => update(p.id, { available: !p.available })} className="text-muted hover:underline">
                    {p.available ? "Mark unavailable" : "Mark available"}
                  </button>
                  <a
                    href={`https://wa.me/${p.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1eaa78] hover:underline"
                  >
                    WhatsApp
                  </a>
                  {p.user_id ? (
                    <button onClick={() => unlink(p.id)} className="text-muted hover:underline">Remove login</button>
                  ) : (
                    <button onClick={() => { setLinkFor(linkFor === p.id ? null : p.id); setLinkEmail(""); }} className="text-brand hover:underline">
                      Link a login
                    </button>
                  )}
                </div>

                {linkFor === p.id && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label htmlFor={`le-${p.id}`} className="sr-only">Account email</label>
                    <input
                      id={`le-${p.id}`}
                      type="email"
                      className={`${input} max-w-[280px]`}
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="Email they signed up with"
                    />
                    <button onClick={() => link(p.id)} className="h-[46px] rounded-xl bg-brand px-5 text-sm font-bold text-white">
                      Link
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}