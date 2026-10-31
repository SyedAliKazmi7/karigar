"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Signed = { signedUrl: string | null };

export default function RequestPhotos({ paths }: { paths?: string[] | null }) {
  const [urls, setUrls] = useState<string[]>([]);
  const key = (paths ?? []).join("|");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const list = key ? key.split("|") : [];
      if (list.length === 0) {
        setUrls([]);
        return;
      }
      const { data } = await supabase.storage
        .from("request-photos")
        .createSignedUrls(list, 3600);
      if (cancelled) return;
      const rows = (data ?? []) as Signed[];
      setUrls(rows.map((d) => d.signedUrl).filter((u): u is string => !!u));
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (urls.length === 0) return null;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <h2 className="mb-3 font-bold">Photos</h2>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((u, i) => (
          <a
            key={u}
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={u}
              alt={`Problem photo ${i + 1}`}
              className="aspect-square w-full rounded-xl object-cover transition hover:opacity-80"
            />
          </a>
        ))}
      </div>
    </div>
  );
}