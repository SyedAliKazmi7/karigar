"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../components/AuthProvider";
import RequestPhotos from "../../../components/RequestPhotos";
import { STATUS, refNo } from "../../../lib/status";

type Req = {
  id: number;
  description: string;
  address: string;
  city: string;
  budget: number | null;
  status: string;
  created_at: string;
  preferred_time: string | null;
  photo_paths: string[];
  categories: { name: string } | null;
};
type Offer = {
  id: number;
  provider_name: string;
  provider_rating: number | null;
  price: number;
  eta_minutes: number | null;
  status: string;
};
type Ev = { id: number; status: string; created_at: string };
type Review = { rating: number; comment: string | null };
type Complaint = { id: number; status: string };

const STEPS = [
  { key: "new", label: "Request sent" },
  { key: "offers_received", label: "Offers received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "on_the_way", label: "On the way" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

const stepIndex = (s: string) =>
  s === "dispatching" ? 0 : Math.max(0, STEPS.findIndex((x) => x.key === s));

const initials = (n: string) =>
  n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user, loading } = useAuth();

  const [req, setReq] = useState<Req | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    const [r, o, e, rv, cp] = await Promise.all([
      supabase
        .from("service_requests")
        .select("id, description, address, city, budget, status, created_at, preferred_time, photo_paths, categories(name)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("offers")
        .select("id, provider_name, provider_rating, price, eta_minutes, status")
        .eq("request_id", id)
        .order("price"),
      supabase.from("job_events").select("id, status, created_at").eq("request_id", id).order("created_at"),
      supabase.from("reviews").select("rating, comment").eq("request_id", id).maybeSingle(),
      supabase
        .from("complaints")
        .select("id, status")
        .eq("request_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    if (r.error) setError(r.error.message);
    else if (!r.data) setNotFound(true);
    else setReq(r.data as unknown as Req);
    setOffers((o.data ?? []) as Offer[]);
    setEvents((e.data ?? []) as Ev[]);
    setReview((rv.data as Review | null) ?? null);
    setComplaint(((cp.data ?? [])[0] as Complaint | undefined) ?? null);
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    load();
    const channel = supabase
      .channel(`request-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers", filter: `request_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, id, load]);

  async function accept(offerId: number) {
    setBusyId(offerId);
    setError("");
    const { error } = await supabase.rpc("accept_offer", { p_offer_id: offerId });
    setBusyId(null);
    if (error) setError(error.message);
    else load();
  }

  async function cancel() {
    if (!confirm("Cancel this request?")) return;
    const { error } = await supabase.from("service_requests").update({ status: "cancelled" }).eq("id", id);
    if (error) setError(error.message);
    else load();
  }

  async function submitReview() {
    if (!user) return;
    setError("");
    if (rating < 1) return setError("Please choose a rating from 1 to 5 stars.");
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      request_id: id,
      customer_id: user.id,
      rating,
      comment: reviewText.trim() || null,
    });
    setSaving(false);
    if (error) setError(error.message);
    else load();
  }

  async function submitComplaint() {
    if (!user) return;
    setError("");
    if (complaintText.trim().length < 10) return setError("Please describe the problem (at least 10 characters).");
    setSaving(true);
    const { error } = await supabase.from("complaints").insert({
      request_id: id,
      customer_id: user.id,
      details: complaintText.trim(),
    });
    setSaving(false);
    if (error) setError(error.message);
    else {
      setShowComplaint(false);
      setComplaintText("");
      load();
    }
  }

  if (loading || !user) {
    return (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }
  if (notFound) {
    return (
      <main className="mx-auto max-w-[1200px] px-8 py-16">
        <p className="text-lg font-bold">Request not found</p>
        <Link href="/requests" className="mt-3 inline-block font-bold text-brand">Back to my requests</Link>
      </main>
    );
  }
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
  const idx = stepIndex(req.status);
  const cancelled = req.status === "cancelled";
  const completed = req.status === "completed";
  const canAccept = ["dispatching", "offers_received"].includes(req.status);
  const canCancel = ["new", "dispatching", "offers_received"].includes(req.status);
  const canComplain = ["confirmed", "on_the_way", "in_progress", "completed"].includes(req.status);
  const accepted = offers.find((o) => o.status === "accepted");
  const pending = offers.filter((o) => o.status === "pending");
  const bestPrice = pending.length > 1 ? Math.min(...pending.map((o) => o.price)) : null;

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <Link href="/requests" className="text-sm text-muted hover:text-brand">&larr; My requests</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="anim-up text-4xl font-extrabold tracking-tight">{req.categories?.name ?? "Service"}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <aside className="anim-up-2 space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <p className="text-xs text-muted">{refNo(req.id)}</p>
            <p className="mt-1 font-bold">{req.description}</p>
            <p className="mt-2 text-sm text-muted">
              {req.address}, {req.city}
              {req.budget ? ` · Budget Rs ${req.budget.toLocaleString()}` : ""}
            </p>

            <div className="mt-6">
              {cancelled ? (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">This request was cancelled.</p>
              ) : (
                STEPS.map((s, i) => (
                  <div key={s.key} className="mb-4 flex items-center gap-3">
                    <span
                      className={`h-3.5 w-3.5 rounded-full ${i <= idx ? "bg-[#1eaa78]" : "bg-gray-300"} ${i === idx && !completed ? "pulse-dot" : ""}`}
                    />
                    <span className={`text-[15px] ${i === idx ? "font-bold" : i < idx ? "" : "text-muted"}`}>{s.label}</span>
                  </div>
                ))
              )}
            </div>

            {canCancel && (
              <button onClick={cancel} className="mt-2 text-sm font-bold text-red-600 hover:underline">
                Cancel request
              </button>
            )}
          </div>

          <RequestPhotos paths={req.photo_paths} />

          {events.length > 0 && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 font-bold">Activity</h2>
              {events.map((e) => (
                <p key={e.id} className="mb-2 text-sm">
                  <span className="font-semibold">{STATUS[e.status]?.label ?? e.status}</span>
                  <span className="text-muted"> · {new Date(e.created_at).toLocaleString()}</span>
                </p>
              ))}
            </div>
          )}
        </aside>

        <section className="anim-up-3 space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight">
              {accepted ? "Your professional" : "Offers"}
            </h2>

            {accepted && (
              <div className="rounded-3xl border-2 border-brand bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light font-extrabold text-brand">
                    {initials(accepted.provider_name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold">{accepted.provider_name}</p>
                    <p className="text-sm text-muted">
                      {accepted.provider_rating ? `Rating ${accepted.provider_rating}` : "New professional"}
                      {accepted.eta_minutes ? ` · Arrives in ${accepted.eta_minutes} min` : ""}
                    </p>
                  </div>
                  <p className="text-2xl font-extrabold">Rs {accepted.price.toLocaleString()}</p>
                </div>
                {!completed && (
                  <p className="mt-4 rounded-xl bg-brand-light p-3 text-sm text-brand">
                    Offer accepted. Our team will contact you to confirm the visit.
                  </p>
                )}
              </div>
            )}

            {!accepted && pending.length === 0 && !cancelled && (
              <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
                <p className="font-bold">We are finding professionals for you</p>
                <p className="mt-1.5 text-sm text-muted">Offers will appear here automatically. You do not need to refresh.</p>
              </div>
            )}

            {!accepted &&
              pending.map((o) => (
                <div
                  key={o.id}
                  className="mb-4 flex flex-wrap items-center gap-4 rounded-3xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light font-extrabold text-brand">
                    {initials(o.provider_name)}
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <p className="text-lg font-bold">
                      {o.provider_name}
                      <span className="ml-2 rounded-full bg-[#d9efe8] px-2.5 py-0.5 text-xs font-bold text-[#0a4a40]">Verified</span>
                      {bestPrice === o.price && (
                        <span className="ml-2 rounded-full bg-[#fdefd0] px-2.5 py-0.5 text-xs font-bold text-[#6b4200]">Best price</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {o.provider_rating ? `Rating ${o.provider_rating}` : "New professional"}
                      {o.eta_minutes ? ` · Arrives in ${o.eta_minutes} min` : ""}
                    </p>
                  </div>
                  <p className="text-2xl font-extrabold">Rs {o.price.toLocaleString()}</p>
                  {canAccept && (
                    <button
                      onClick={() => accept(o.id)}
                      disabled={busyId !== null}
                      className="h-[46px] rounded-xl bg-brand px-6 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
                    >
                      {busyId === o.id ? (<><span className="spinner spinner-sm" />Accepting...</>) : "Accept offer"}
                    </button>
                  )}
                </div>
              ))}
          </div>

          {completed && accepted && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-extrabold">Rate your professional</h2>
              {review ? (
                <div className="mt-3">
                  <p className="text-2xl text-accent" aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</p>
                  {review.comment && <p className="mt-2 text-[15px]">{review.comment}</p>}
                  <p className="mt-2 text-sm text-muted">Thank you for your feedback.</p>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="flex gap-1" role="group" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        aria-pressed={rating === n}
                        className={`text-4xl transition hover:scale-110 ${n <= rating ? "text-accent" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <label htmlFor="rv" className="mb-1.5 mt-4 block text-sm font-bold">Comment (optional)</label>
                  <textarea
                    id="rv"
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light"
                  />
                  <button
                    onClick={submitReview}
                    disabled={saving}
                    className="mt-4 h-[46px] rounded-xl bg-accent px-6 font-bold text-[#2a1a00] transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {saving ? (<><span className="spinner spinner-sm" />Saving...</>) : "Submit rating"}
                  </button>
                </div>
              )}
            </div>
          )}

          {canComplain && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-extrabold">Something went wrong?</h2>
              {complaint ? (
                <p className="mt-2 text-sm text-muted">
                  Your complaint was sent and is <span className="font-bold text-ink">{complaint.status.replace("_", " ")}</span>.
                  Our team will contact you.
                </p>
              ) : showComplaint ? (
                <div className="mt-3">
                  <label htmlFor="cp" className="mb-1.5 block text-sm font-bold">Describe the problem</label>
                  <textarea
                    id="cp"
                    rows={3}
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light"
                  />
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={submitComplaint}
                      disabled={saving}
                      className="h-[46px] rounded-xl bg-brand px-6 font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
                    >
                      {saving ? (<><span className="spinner spinner-sm" />Sending...</>) : "Send complaint"}
                    </button>
                    <button
                      onClick={() => setShowComplaint(false)}
                      className="h-[46px] rounded-xl border border-gray-300 px-5 font-bold text-brand"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted">Tell us if the professional did not show up or the work was not good.</p>
                  <button
                    onClick={() => setShowComplaint(true)}
                    className="mt-3 text-sm font-bold text-red-600 hover:underline"
                  >
                    Report a problem
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}