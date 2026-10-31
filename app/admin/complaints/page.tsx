"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useStaff } from "../../../components/useStaff";
import { refNo } from "../../../lib/status";

type C = {
  id: number;
  details: string;
  status: string;
  created_at: string;
  request_id: number;
  profiles: { full_name: string | null; phone: string | null } | null;
};

const BADGE: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_review: "bg-[#fdefd0] text-[#6b4200]",
  resolved: "bg-[#d9efe8] text-[#0a4a40]",
};

export default function ComplaintsPage() {
  const { ready } = useStaff();
  const [rows, setRows] = useState<C[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("id, details, status, created_at, request_id, profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as unknown as C[]);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function setStatus(id: number, status: string) {
    const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
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

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <Link href="/admin" className="text-sm text-muted hover:text-brand">&larr; Dashboard</Link>
      <h1 className="anim-up mb-6 mt-2 text-4xl font-extrabold tracking-tight">Complaints</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      {!rows && !error && (
        <div className="loader-inline" role="status" aria-label="Loading complaints">
          <span className="spinner" />
        </div>
      )}
      {rows && rows.length === 0 && (
        <p className="rounded-3xl border border-gray-200 bg-white p-8 text-muted">No complaints. Great!</p>
      )}

      <div className="anim-up-2 space-y-4">
        {rows?.map((c) => (
          <div key={c.id} className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link href={`/admin/requests/${c.request_id}`} className="font-bold text-brand hover:underline">
                  {refNo(c.request_id)}
                </Link>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${BADGE[c.status] ?? ""}`}>
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <span className="text-sm text-muted">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-3">{c.details}</p>
            <p className="mt-2 text-sm text-muted">
              {c.profiles?.full_name ?? "Customer"}
              {c.profiles?.phone && (
                <>
                  {" · "}
                  <a href={`tel:${c.profiles.phone}`} className="font-bold text-brand hover:underline">{c.profiles.phone}</a>
                </>
              )}
            </p>
            {c.status !== "resolved" && (
              <div className="mt-3 flex gap-4 text-sm font-bold">
                {c.status === "open" && (
                  <button onClick={() => setStatus(c.id, "in_review")} className="text-brand hover:underline">Start review</button>
                )}
                <button onClick={() => setStatus(c.id, "resolved")} className="text-brand hover:underline">Mark resolved</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}