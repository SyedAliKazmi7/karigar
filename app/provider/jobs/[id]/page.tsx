"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../components/AuthProvider";
import RequestPhotos from "../../../../components/RequestPhotos";
import { STATUS, refNo } from "../../../../lib/status";
import { timeAgo, waNumber } from "../../../../lib/format";

type Job = {
  id: number;
  category_name: string;
  description: string;
  city: string;
  budget: number | null;
  preferred_time: string | null;
  created_at: string;
  status: string;
  my_offer_id: number | null;
  my_offer_price: number | null;
  my_offer_eta: number | null;
  my_offer_status: string | null;
  can_offer: boolean;
  address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_paths: string[] | null;
};

const input =
  "h-[48px] w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";

export default function ProviderJobPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user, provider, loading } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (provider?.status !== "verified") router.replace("/provider");
  }, [loading, user, provider?.status, router]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("provider_job", { p_id: id });
    if (error) setError(error.message);
    const row = (Array.isArray(data) ? data[0] : null) as Job | null;
    setJob(row ?? null);
    setReady(true);
  }, [id]);

  useEffect(() => {
    if (!user || provider?.status !== "verified" || !id) return;
    load();
    const timer = setInterval(load, 15000);
    const channel = supabase
      .channel(`provider-job-${id}-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [user, provider?.status, id, load]);

  async function sendOffer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amount = Number(price);
    if (!Number.isInteger(amount) || amount <= 0) return setError("Enter your price as a whole number, for example 1500.");
    const minutes = eta.trim() === "" ? null : Number(eta);
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 2880))
      return setError("Arrival time must be between 1 and 2880 minutes.");

    setBusy(true);
    const { error } = await supabase.rpc("send_offer", { p_request: id, p_price: amount, p_eta: minutes });
    setBusy(false);
    if (error) {
      if (error.message.includes("duplicate key")) return setError("You have already sent an offer for this job.");
      return setError(error.message);
    }
    setPrice("");
    setEta("");
    load();
  }

  async function withdraw() {
    if (!job?.my_offer_id) return;
    if (!confirm("Withdraw your offer?")) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.from("offers").delete().eq("id", job.my_offer_id);
    setBusy(false);
    if (error) setError(error.message);
    else load();
  }

  if (loading || !user || !ready) {
    return (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }

  if (!job) {
    return (
      <main className="mx-auto max-w-[900px] px-5 py-16 sm:px-8">
        <p className="text-lg font-bold">This job is not available</p>
        <p className="mt-1 text-muted">It may have been filled by another professional, or cancelled.</p>
        <Link href="/provider" className="mt-4 inline-block font-bold text-brand">Back to my jobs</Link>
      </main>
    );
  }

  const st = STATUS[job.status] ?? { label: job.status, cls: "bg-gray-200 text-gray-700" };
  const accepted = job.my_offer_status === "accepted";
  const hasMap = job.latitude != null && job.longitude != null;

  return (
    <main className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8">
      <Link href="/provider" className="text-sm text-muted hover:text-brand">&larr; My jobs</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="anim-up text-4xl font-extrabold tracking-tight">
          {job.category_name} <span className="text-muted">{refNo(job.id)}</span>
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
      </div>

      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="anim-up-2 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="mb-2 font-bold">The job</h2>
            <p className="text-[16px]">{job.description}</p>
            <p className="mt-3 text-sm text-muted">
              {job.city}
              {job.budget ? ` · Customer budget Rs ${job.budget.toLocaleString()}` : " · No budget given"}
              {` · Posted ${timeAgo(job.created_at)}`}
            </p>
            {job.preferred_time && (
              <p className="mt-1 text-sm text-muted">
                Preferred time: {new Date(job.preferred_time).toLocaleString()}
              </p>
            )}
            {!accepted && (
              <p className="mt-4 rounded-xl bg-brand-light p-3 text-[13px] text-muted">
                The exact address, phone number, map pin and photos are shown only after the customer accepts your offer.
              </p>
            )}
          </div>

          {accepted && (
            <div className="rounded-3xl border-2 border-brand bg-white p-6">
              <h2 className="text-xl font-extrabold">Offer accepted</h2>
              <p className="mt-1 text-sm text-muted">Go to the customer and finish the job. Our team will update the status.</p>

              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Customer</dt>
                  <dd className="font-bold">{job.customer_name ?? "Customer"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">Address</dt>
                  <dd className="font-bold">{job.address}, {job.city}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-3">
                {job.customer_phone && (
                  <>
                    <a
                      href={`tel:${job.customer_phone}`}
                      className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                    >
                      Call {job.customer_phone}
                    </a>
                    <a
                      href={`https://wa.me/${waNumber(job.customer_phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-[#1eaa78] px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
                {hasMap && (
                  <a
                    href={`https://www.google.com/maps?q=${job.latitude},${job.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-gray-50"
                  >
                    Open map
                  </a>
                )}
              </div>
            </div>
          )}

          {accepted && <RequestPhotos paths={job.photo_paths} />}
        </section>

        <aside className="anim-up-3 space-y-4">
          {job.can_offer && (
            <form onSubmit={sendOffer} noValidate className="rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-extrabold">Send your offer</h2>
              <p className="mt-1 text-sm text-muted">
                The customer sees your name, rating, price and arrival time.
              </p>

              <label htmlFor="price" className="mb-1.5 mt-4 block text-sm font-bold">Your price (PKR)</label>
              <input id="price" inputMode="numeric" className={input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={job.budget ? String(job.budget) : "1500"} />

              <label htmlFor="eta" className="mb-1.5 mt-4 block text-sm font-bold">Arrive in (minutes)</label>
              <input id="eta" inputMode="numeric" className={input} value={eta} onChange={(e) => setEta(e.target.value)} placeholder="30" />

              <button
                type="submit"
                disabled={busy}
                className="mt-5 h-[48px] w-full rounded-xl bg-accent font-bold text-[#2a1a00] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? (<><span className="spinner spinner-sm" />Sending...</>) : "Send offer"}
              </button>
            </form>
          )}

          {job.my_offer_id && job.my_offer_status === "pending" && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <span className="rounded-full bg-[#fdefd0] px-3 py-1 text-xs font-bold text-[#6b4200]">Waiting for the customer</span>
              <p className="mt-3 text-2xl font-extrabold">Rs {job.my_offer_price?.toLocaleString()}</p>
              {job.my_offer_eta && <p className="text-sm text-muted">Arrive in {job.my_offer_eta} min</p>}
              <button
                onClick={withdraw}
                disabled={busy}
                className="mt-4 text-sm font-bold text-red-600 hover:underline disabled:opacity-60"
              >
                Withdraw offer
              </button>
            </div>
          )}

          {job.my_offer_status === "rejected" && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600">Not selected</span>
              <p className="mt-3 text-sm text-muted">
                The customer chose another offer or declined yours (Rs {job.my_offer_price?.toLocaleString()}).
              </p>
            </div>
          )}

          {accepted && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <p className="text-sm text-muted">Your agreed price</p>
              <p className="text-3xl font-extrabold">Rs {job.my_offer_price?.toLocaleString()}</p>
              <p className="mt-2 text-sm text-muted">Payment is in cash after the job is done.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}