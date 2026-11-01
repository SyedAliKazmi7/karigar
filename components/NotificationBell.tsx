"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

type N = {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.id;
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<N | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [list, count] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, title, body, link, read, created_at")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false),
    ]);
    setItems((list.data ?? []) as N[]);
    setUnread(count.count ?? 0);
  }, []);

  useEffect(() => {
    if (!uid) return;
    load();
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        (payload) => {
          setToast(payload.new as unknown as N);
          load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openItem(n: N) {
    setOpen(false);
    setToast(null);
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      load();
    }
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    load();
  }

  if (!uid) return null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 text-brand transition hover:bg-gray-50"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 20h4" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[84px] z-50 max-h-[70vh] overflow-auto rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[52px] sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="font-bold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-sm font-bold text-brand hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">No notifications yet.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n)}
                    className={`flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 ${
                      n.read ? "" : "bg-brand-light/50"
                    }`}
                  >
                    <span className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${n.read ? "bg-transparent" : "bg-[#1eaa78]"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{n.title}</span>
                      {n.body && <span className="block truncate text-[13px] text-muted">{n.body}</span>}
                      <span className="mt-0.5 block text-xs text-muted">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="anim-up fixed right-4 top-[88px] z-[60] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
        >
          <button onClick={() => openItem(toast)} className="block w-full pr-6 text-left">
            <span className="block text-sm font-bold">{toast.title}</span>
            {toast.body && <span className="mt-0.5 block text-[13px] text-muted">{toast.body}</span>}
            <span className="mt-1.5 block text-xs font-bold text-brand">View &rarr;</span>
          </button>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="absolute right-3 top-2 text-xl leading-none text-muted hover:text-ink"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}