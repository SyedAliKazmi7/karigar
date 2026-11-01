"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { useStaff } from "../../../../components/useStaff";
import RequestPhotos from "../../../../components/RequestPhotos";
import { STATUS, refNo } from "../../../../lib/status";

type Req = {
  id: number;
  description: string;
  address: string;
  city: string;
  budget: number | null;
  status: string;
  created_at: string;
  category_id: number;
  latitude: number | null;
  longitude: number | null;
  photo_paths: string[];
  categories: { name: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};
type Offer = {
  id: number;
  provider_id: number;
  provider_name: string;
  provider_rating: number | null;
  price: number;
  eta_minutes: number | null;
  status: string;
};
type Prov = {
  id: number;
  full_name: string;
  whatsapp: string;
  avg_rating: number | null;
  areas: string[];
  experience_years: number | null;
  user_id: string | null;
};

const NEXT: Record<string, { to: string; label: string }> = {
  new: { to: "dispatching", label: "Start finding professionals" },
  confirmed: { to: "on_the_way", label: "Mark as On the way" },
  on_the_way: { to: "in_progress", label: "Mark as In progress" },
  in_progress: { to: "completed", label: "Mark as Completed" },
};

const input =
  "h-[46px] w-full rounded-xl border border-gray-300 bg-white px-3 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";

export default function AdminRequestPage() {
  const { ready } = useStaff();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [req, setReq] = useState<Req | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [provs, setProvs] = useState<Prov[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [provId, setProvId] = useState("");
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");

  const load = useCallback(async () => {
    const r = await supabase
      .from("service_requests")
      .select("id, description, address, city, budget, status, created_at, category_id, latitude, longitude, photo_paths, categories(name), profiles(full_name, phone)")
      .eq("id", id)
      .maybeSingle();
    if (r.error) return setError(r.error.message);
    if (!r.data) return setNotFound(true);
    const request = r.data as unknown as Req;
    setReq(request);

    const [o, p] = await Promise.all([
      supabase
        .from("offers")
        .select("id, provider_id, provider_name, provider_rating, price, eta_minutes, status")
        .eq("request_id", id)
        .order("created_at"),
      supabase
        .from("providers")
        .select("id, full_name, whatsapp, avg_rating, areas, experience_years, user_id, provider_categories!inner(category_id)")
        .eq("status", "verified")
        .eq("available", true)
        .eq("provider_categories.category_id", request.category_id),
    ]);
    setOffers((o.data ?? []) as Offer[]);
    setProvs((p.data ?? []) as unknown as Prov[]);
  }, [id]);

  useEffect(() => {
    if (!ready || !id) return;
    load();
    const channel = supabase
      .channel(`admin-request-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `request_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ready, id, load]);

  async function setStatus(to: string) {
    setBusy(true);
    setError("");
    const { error } = await supabase.from("service_requests").update({ status: to }).eq("id", id);
    setBusy(false);
    if (error) setError(error.message);
    else load();
  }

  async function cancel() {
    if (confirm("Cancel this request?")) setStatus("cancelled");
  }

  async function addOffer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const prov = provs.find((p) => p.id === Number(provId));
    const amount = Number(price);
    if (!prov) return setError("Choose a professional.");
    if (!Number.isInteger(amount) || amount <= 0) return setError("Enter a valid price.");
    const minutes = eta.trim() === "" ? null : Number(eta);
    if (minutes !== null && (!Number.isInteger(minutes) || minutes <= 0)) return setError("Arrival time must be a positive number of minutes.");

    setBusy(true);
    const { error } = await supabase.from("offers").insert({
      request_id: id,
      provider_id: prov.id,
      provider_name: prov.full_name,
      price: amount,
      eta_minutes: minutes,
    });
    setBusy(false);
    if (error) {
      return setError(
        error.code === "23505" ? "This professional already has an offer on this request." : error.message
      );
    }
    setProvId("");
    setPrice("");
    setEta("");
    load();
  }

  function waLink(p: Prov) {
    if (!req) return "#";
    const msg =
      `Hello ${p.full_name}, a new ${req.categories?.name ?? "service"} job is available on Karigar in ${req.city}. ` +
      `Problem: ${req.description}. ` +
      (req.budget ? `Customer budget: Rs ${req.budget}. ` : "") +
      `Please reply with your price and how soon you can arrive.`;
    return `https://wa.me/${p.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  }

  if (!ready) {
    return (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }
  if (notFound)
    return (
      <main className="mx-auto max-w-[1200px] px-8 py-16">
        <p className="text-lg font-bold">Request not found</p>
        <Link href="/admin" className="mt-3 inline-block font-bold text-brand">Back to dashboard</Link>
      </main>
    );
  if (!req) {
    return error ? (
      <main className="mx-auto max-w-[1200px] px-8 py-16 font-semibold text-red-600">{error}</main>
    ) : (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }

  const st = STATUS[req.status] ?? { label: req.status, cls: "bg-gray-200 text-gray-700" };
  const next = NEXT[req.status];
  const canOffer = ["new", "dispatching", "offers_received"].includes(req.status);
  const closed = ["completed", "cancelled"].includes(req.status);
  const accepted = offers.find((o) => o.status === "accepted");
  const hasPin = req.latitude != null && req.longitude != null;
  const free = provs.filter((p) => !offers.some((o) => o.provider_id === p.id));
  const autoCount = provs.filter((p) => p.user_id).length;

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <Link href="/admin" className="text-sm text-muted hover:text-brand">&larr; Dashboard</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="anim-up text-4xl font-extrabold tracking-tight">
          {req.categories?.name ?? "Service"} <span className="text-muted">{refNo(req.id)}</span>
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="mb-2 font-bold">Job</h2>
            <p>{req.description}</p>
            <p className="mt-2 text-sm text-muted">
              {req.address}, {req.city}
              {req.budget ? ` · Budget Rs ${req.budget.toLocaleString()}` : ""}
            </p>
            {hasPin ? (
              <a
                href={`https://www.google.com/maps?q=${req.latitude},${req.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-bold text-brand hover:underline"
              >
                Open pinned location in Maps &rarr;
              </a>
            ) : (
              <p className="mt-3 text-xs text-muted">No map pin from the customer.</p>
            )}
          </div>

          <RequestPhotos paths={req.photo_paths} />

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="mb-2 font-bold">Customer</h2>
            <p>{req.profiles?.full_name ?? "Customer"}</p>
            {req.profiles?.phone && (
              <a href={`tel:${req.profiles.phone}`} className="text-sm font-bold text-brand hover:underline">
                {req.profiles.phone}
              </a>
            )}
          </div>

          {accepted && (
            <div className="rounded-3xl border-2 border-brand bg-white p-6">
              <h2 className="mb-2 font-bold">Assigned professional</h2>
              <p className="font-semibold">{accepted.provider_name}</p>
              <p className="text-sm text-muted">Rs {accepted.price.toLocaleString()}</p>
            </div>
          )}

          {!closed && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 font-bold">Actions</h2>
              {next && (
                <button
                  onClick={() => setStatus(next.to)}
                  disabled={busy}
                  className="h-[48px] w-full rounded-xl bg-brand font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {busy ? (<><span className="spinner spinner-sm" />Updating...</>) : next.label}
                </button>
              )}
              <button onClick={cancel} disabled={busy} className="mt-3 text-sm font-bold text-red-600 hover:underline">
                Cancel request
              </button>
            </div>
          )}
        </aside>

        <section className="space-y-6">
          {canOffer && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-extrabold">Suggested professionals</h2>
              <p className="text-sm text-muted">Verified and available for {req.categories?.name}.</p>
              {autoCount > 0 && (
                <p className="mb-4 mt-2 rounded-xl bg-brand-light p-3 text-[13px] text-brand">
                  {autoCount} professional{autoCount > 1 ? "s" : ""} with a login got an alert in the app and can send offers themselves.
                  Use WhatsApp for the others.
                </p>
              )}
              {provs.length === 0 && (
                <p className="mt-4 rounded-xl bg-[#fdefd0] p-4 text-sm text-[#6b4200]">
                  No verified professionals for this service yet. Verify applications or add them on the Providers page.
                </p>
              )}
              {provs.map((p) => {
                const sent = offers.find((o) => o.provider_id === p.id);
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 border-t border-gray-100 py-3 first:border-t-0">
                    <div className="min-w-[160px] flex-1">
                      <p className="font-bold">
                        {p.full_name}
                        {p.user_id ? (
                          <span className="ml-2 rounded-full bg-[#d9efe8] px-2.5 py-0.5 text-xs font-bold text-[#0a4a40]">Gets app alerts</span>
                        ) : (
                          <span className="ml-2 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-600">WhatsApp only</span>
                        )}
                        {sent && (
                          <span className="ml-2 rounded-full bg-[#fdefd0] px-2.5 py-0.5 text-xs font-bold text-[#6b4200]">
                            Offered Rs {sent.price.toLocaleString()}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted">
                        {p.avg_rating ? `Rating ${p.avg_rating}` : "New"}
                        {p.experience_years ? ` · ${p.experience_years} years` : ""}
                        {p.areas.length ? ` · ${p.areas.join(", ")}` : ""}
                      </p>
                    </div>
                    <a
                      href={waLink(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-[#1eaa78] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
                    >
                      WhatsApp
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {canOffer && free.length > 0 && (
            <form onSubmit={addOffer} className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="mb-1 text-xl font-extrabold">Record an offer</h2>
              <p className="mb-4 text-sm text-muted">Enter the price a professional gave you on WhatsApp or by phone.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="prov" className="mb-1.5 block text-sm font-bold">Professional</label>
                  <select id="prov" className={input} value={provId} onChange={(e) => setProvId(e.target.value)}>
                    <option value="">Choose</option>
                    {free.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="mb-1.5 block text-sm font-bold">Price (PKR)</label>
                  <input id="price" inputMode="numeric" className={input} value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="eta" className="mb-1.5 block text-sm font-bold">Arrives in (min)</label>
                  <input id="eta" inputMode="numeric" className={input} value={eta} onChange={(e) => setEta(e.target.value)} />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="mt-4 h-[46px] rounded-xl bg-accent px-6 font-bold text-[#2a1a00] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? (<><span className="spinner spinner-sm" />Adding...</>) : "Add offer"}
              </button>
            </form>
          )}

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="mb-3 text-xl font-extrabold">Offers ({offers.length})</h2>
            {offers.length === 0 && <p className="text-sm text-muted">No offers yet.</p>}
            {offers.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 py-3 first:border-t-0">
                <div>
                  <p className="font-bold">{o.provider_name}</p>
                  <p className="text-sm text-muted">
                    {o.eta_minutes ? `Arrives in ${o.eta_minutes} min` : "No arrival time"}
                  </p>
                </div>
                <p className="font-extrabold">Rs {o.price.toLocaleString()}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    o.status === "accepted" ? "bg-[#d9efe8] text-[#0a4a40]" : o.status === "rejected" ? "bg-gray-200 text-gray-600" : "bg-[#fdefd0] text-[#6b4200]"
                  }`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}