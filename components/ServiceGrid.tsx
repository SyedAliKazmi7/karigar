"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

type Category = { id: number; name: string; description: string | null };

const icons: Record<string, string> = {
  Plumber: "M12 3C9 8 6 11 6 15a6 6 0 0012 0c0-4-3-7-6-12z",
  Electrician: "M13 2L4 14h7l-1 8 9-12h-7z",
  Maid: "M3 11l9-8 9 8v9H3z",
  "AC technician": "M12 2v20M3 7l18 10M21 7L3 17",
  Carpenter: "M3 8h18v8H3zM7 8v4M11 8v3M15 8v4",
  Painter: "M4 20c4 0 5-2 5-4l9-9-3-3-9 9c-2 0-4 1-4 4z",
};

export default function ServiceGrid() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, description")
      .eq("active", true)
      .order("id")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setItems(data ?? []);
      });
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;

  if (!items) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading services">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="skeleton h-[190px] rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`/requests/new?category=${c.id}`}
          className="group rounded-3xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
        >
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand-light text-brand transition group-hover:bg-accent group-hover:text-[#2a1a00]">
            <Icon d={icons[c.name] ?? icons.Maid} />
          </div>
          <h3 className="mt-5 text-xl font-bold">{c.name}</h3>
          <p className="mt-1.5 text-sm text-muted">{c.description}</p>
          <p className="mt-4 text-sm font-bold text-brand">Get offers &rarr;</p>
        </Link>
      ))}
    </div>
  );
}