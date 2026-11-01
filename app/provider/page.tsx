"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/AuthProvider";
import { STATUS, refNo } from "../../lib/status";
import { timeAgo } from "../../lib/format";

type OpenJob = {
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
  my_offer_status: string | null;
};
type MyJob = {
  id: number;
  category_name: string;
  description: string;
  city: string;
  status: string;
  my_offer_price: number;
  created_at: string;
};

export default function ProviderDashboard() {
  const router = useRouter();
  const { user, provider, loading, refreshProvider } = useAuth();
  const [open, setOpen] = useState<OpenJob[] | null>(null);
  const [mine, setMine] = useState<MyJob[] | null>(null);
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const verified = provider?.status === "verified";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    const [o, m] = await Promise.all([supabase.rpc("provider_open_jobs"), supabase.rpc("provider_my_jobs")]);
    if (o.error) setError(o.error.message);
    setOpen((o.data ?? []) as OpenJob[]);
    setMine((m.data ?? []) as MyJob[]);
  }, []);

  useEffect(() => {
    if (!user || !verified) return;
    load();
    const timer = setInterval(load, 20000);
    const channel = supabase
      .channel(`provider-feed-${user.id}`)
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
  }, [user, verified, load]);

  async function toggleAvailable() {
    if (!provider) return;
    setSaving(true);
    await supabase.rpc("set_my_availability", { p_available: !provider.available });
    await refreshProvider();
    setSaving(false);
  }

  if (loading || !user) {
    return (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }

  if (!provider) {
    return (
      <main className="mx-auto max-w-[700px] px-5 py-16 sm:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Become a Karigar professional</h1>
          <p className="mt-3 text-muted">
            Apply once, and after verification you will see jobs near you and send your own price.
          </p>
          <Link href="/join" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-bold text-[#2a1a00]">
            Apply now
          </Link>
        </div>
      </main>
    );
  }

  if (provider.status === "pending") {
    return (
      <main className="mx-auto max-w-[700px] px-5 py-16 sm:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <span className="rounded-full bg-[#fdefd0] px-3.5 py-1.5 text-xs font-bold text-[#6b4200]">Under review</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Thanks, {provider.full_name}</h1>
          <p className="mt-3 text-muted">
            Our team is checking your details and will contact you on WhatsApp. You will get a notification here
            as soon as you are verified.
          </p>
        </div>
      </main>
    );
  }

  if (provider.status === "suspended") {
    return (
      <main className="mx-auto max-w-[700px] px-5 py-16 sm:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <span className="rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-700">Suspended</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Your profile is suspended</h1>
          <p className="mt-3 text-muted">Please contact our support team to find out why and how to continue.</p>
        </div>
      </main>
    );
  }

  const openJobs = open ?? [];
  const myJobs = mine ?? [];
  const waiting = openJobs.filter((j) => !j.my_offer_id).length;
  const active = myJobs.filter((j) => !["completed", "cancelled"].includes(j.status)).length;

  const stats = [
    { label: "Rating", value: provider.avg_rating ? String(provider.avg_rating) : "New" },
    { label: "Jobs completed", value: String(provider.jobs_completed) },
    { label: "New jobs waiting", value: String(waiting) },
    { label: "Active jobs", value: String(active) },
  ];

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="anim-up text-4xl font-extrabold tracking-tight">Hello, {provider.full_name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted">Send your price on jobs that match your services.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={provider.available}
          onClick={toggleAvailable}
          disabled={saving}
          className={`flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-bold transition disabled:opacity-60 ${
            provider.available ? "border-[#1eaa78] bg-[#d9efe8] text-[#0a4a40]" : "border-gray-300 bg-white text-muted"
          }`}
        >
          <span className={`h-3 w-3 rounded-full ${provider.available ? "pulse-dot bg-[#1eaa78]" : "bg-gray-400"}`} />
          {provider.available ? "Available for new jobs" : "Not available"}
        </button>
      </div>

      <div className="anim-up-2 mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      {!provider.available && (
        <p className="mb-6 rounded-2xl bg-[#fdefd0] p-4 text-sm font-semibold text-[#6b4200]">
          You are marked as not available, so you will not get new job alerts or be able to send offers.
        </p>
      )}
      {error && <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>}

      <div className="mb-4 flex gap-2">
        {([
          ["open", `Open jobs (${openJobs.length})`],
          ["mine", `My jobs (${myJobs.length})`],
        ] as const).map(([k, t]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              tab === k ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-muted hover:border-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {(open === null || mine === null) && (
        <div className="loader-inline" role="status" aria-label="Loading jobs">
          <span className="spinner" />
        </div>
      )}

      {tab === "open" && open !== null && (
        <div className="space-y-4">
          {openJobs.length === 0 && (
            <p className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-muted">
              No open jobs for your services right now. New jobs appear here automatically.
            </p>
          )}
          {openJobs.map((j) => (
            <Link
              key={j.id}
              href={`/provider/jobs/${j.id}`}
              className="block rounded-3xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{refNo(j.id)} · {timeAgo(j.created_at)}</p>
                  <h2 className="text-xl font-bold">{j.category_name} · {j.city}</h2>
                </div>
                {j.my_offer_status === "pending" ? (
                  <span className="rounded-full bg-[#fdefd0] px-3 py-1 text-xs font-bold text-[#6b4200]">
                    Your offer: Rs {j.my_offer_price?.toLocaleString()} · waiting
                  </span>
                ) : j.my_offer_status === "rejected" ? (
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600">Not selected</span>
                ) : (
                  <span className="rounded-full bg-[#d9efe8] px-3 py-1 text-xs font-bold text-[#0a4a40]">New</span>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-[15px]">{j.description}</p>
              <p className="mt-2 text-sm text-muted">
                {j.budget ? `Customer budget Rs ${j.budget.toLocaleString()}` : "No budget given"}
              </p>
              <p className="mt-3 text-sm font-bold text-brand">
                {j.my_offer_id ? "View" : "View and send offer"} &rarr;
              </p>
            </Link>
          ))}
        </div>
      )}

      {tab === "mine" && mine !== null && (
        <div className="space-y-4">
          {myJobs.length === 0 && (
            <p className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-muted">
              Jobs where a customer accepts your offer will appear here.
            </p>
          )}
          {myJobs.map((j) => {
            const st = STATUS[j.status] ?? { label: j.status, cls: "bg-gray-200 text-gray-700" };
            return (
              <Link
                key={j.id}
                href={`/provider/jobs/${j.id}`}
                className="block rounded-3xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">{refNo(j.id)}</p>
                    <h2 className="text-xl font-bold">{j.category_name} · {j.city}</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[15px]">{j.description}</p>
                <p className="mt-2 text-sm font-bold">Your price: Rs {j.my_offer_price.toLocaleString()}</p>
                <p className="mt-3 text-sm font-bold text-brand">Open job details &rarr;</p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}