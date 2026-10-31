"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/AuthProvider";
import { STATUS, refNo } from "../../lib/status";

type Row = {
  id: number;
  category_id: number;
  description: string;
  address: string;
  city: string;
  budget: number | null;
  status: string;
  created_at: string;
};

export default function RequestsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [names, setNames] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    setCreated(new URLSearchParams(window.location.search).get("created") === "1");
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("categories")
      .select("id, name")
      .then(({ data }) => {
        const map: Record<number, string> = {};
        (data ?? []).forEach((c: { id: number; name: string }) => (map[c.id] = c.name));
        setNames(map);
      });
    supabase
      .from("service_requests")
      .select("id, category_id, description, address, city, budget, status, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows((data ?? []) as Row[]);
      });
  }, [user]);

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="anim-up text-4xl font-extrabold tracking-tight">My requests</h1>
        <Link
          href="/requests/new"
          className="rounded-xl bg-accent px-5 py-3 font-bold text-[#2a1a00] transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          New request
        </Link>
      </div>

      {created && (
        <p className="mb-6 rounded-2xl bg-brand-light p-4 text-sm font-semibold text-brand">
          Your request has been sent. Our team will find professionals for you.
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}

      {(loading || (!rows && !error)) && (
        <div className="space-y-4" role="status" aria-label="Loading requests">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-[120px] rounded-3xl" />
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-lg font-bold">No requests yet</p>
          <p className="mt-1.5 text-muted">Post your first job and get offers from verified professionals.</p>
          <Link href="/requests/new" className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white">
            Request a service
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {rows?.map((r) => {
          const st = STATUS[r.status] ?? { label: r.status, cls: "bg-gray-200 text-gray-700" };
          return (
            <div
              key={r.id}
              className="rounded-3xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{refNo(r.id)}</p>
                  <h2 className="text-xl font-bold">{names[r.category_id] ?? "Service"}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
              </div>
              <p className="mt-3 text-[15px]">{r.description}</p>
              <p className="mt-2 text-sm text-muted">
                {r.address}, {r.city}
                {r.budget ? ` · Budget Rs ${r.budget.toLocaleString()}` : ""}
                {" · "}
                {new Date(r.created_at).toLocaleDateString()}
              </p>
              <Link
                href={`/requests/${r.id}`}
                className="mt-4 inline-block text-sm font-bold text-brand hover:underline"
              >
                View details &rarr;
              </Link>
            </div>
          );
        })}
      </div>
    </main>
  );
}