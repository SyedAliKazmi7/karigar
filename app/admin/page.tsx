"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useStaff } from "../../components/useStaff";
import { STATUS, refNo } from "../../lib/status";

type Row = {
  id: number;
  description: string;
  city: string;
  status: string;
  budget: number | null;
  created_at: string;
  categories: { name: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "attention", label: "Needs attention", match: (s) => ["new", "dispatching"].includes(s) },
  { key: "offers", label: "Offers received", match: (s) => s === "offers_received" },
  { key: "active", label: "Active jobs", match: (s) => ["confirmed", "on_the_way", "in_progress"].includes(s) },
  { key: "done", label: "Completed", match: (s) => s === "completed" },
  { key: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
];

export default function AdminDashboard() {
  const { ready } = useStaff();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("service_requests")
      .select("id, description, city, status, budget, created_at, categories(name), profiles(full_name, phone)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else setRows((data ?? []) as unknown as Row[]);
  }, []);

  useEffect(() => {
    if (!ready) return;
    load();
    const channel = supabase
      .channel("admin-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ready, load]);

  if (!ready) {
    return (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }

  const all = rows ?? [];
  const today = new Date().toDateString();
  const kpis = [
    { label: "Requests today", value: all.filter((r) => new Date(r.created_at).toDateString() === today).length },
    { label: "Needs attention", value: all.filter((r) => ["new", "dispatching"].includes(r.status)).length },
    { label: "Active jobs", value: all.filter((r) => ["confirmed", "on_the_way", "in_progress"].includes(r.status)).length },
    { label: "Completed", value: all.filter((r) => r.status === "completed").length },
  ];
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const shown = all.filter((r) => active.match(r.status));

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="anim-up text-4xl font-extrabold tracking-tight">Dashboard</h1>
        <span className="flex items-center gap-2 rounded-full bg-[#d9efe8] px-3.5 py-1.5 text-xs font-bold text-[#0a4a40]">
          <span className="pulse-dot h-2 w-2 rounded-full bg-[#1eaa78]" /> Live
        </span>
      </div>

      <div className="anim-up-2 mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-3xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="mt-1 text-3xl font-extrabold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              filter === f.key ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-muted hover:border-gray-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="anim-up-3 overflow-hidden rounded-3xl border border-gray-200 bg-white">
        {!rows && !error && (
          <div className="loader-inline" role="status" aria-label="Loading requests">
            <span className="spinner" />
          </div>
        )}
        {rows && shown.length === 0 && <p className="p-8 text-muted">No requests here.</p>}
        {shown.map((r) => {
          const st = STATUS[r.status] ?? { label: r.status, cls: "bg-gray-200 text-gray-700" };
          return (
            <Link
              key={r.id}
              href={`/admin/requests/${r.id}`}
              className="grid items-center gap-3 border-b border-gray-100 px-6 py-4 transition last:border-b-0 hover:bg-gray-50 md:grid-cols-[110px_1.2fr_1.2fr_1fr_1.2fr_70px]"
            >
              <span className="text-sm font-bold">{refNo(r.id)}</span>
              <span className="font-semibold">{r.categories?.name ?? "Service"}</span>
              <span className="text-sm text-muted">{r.profiles?.full_name ?? "Customer"}</span>
              <span className="text-sm text-muted">{r.city}</span>
              <span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
              </span>
              <span className="text-sm font-bold text-brand">Open &rarr;</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}