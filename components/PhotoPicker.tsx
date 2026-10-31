"use client";

import { useEffect, useMemo } from "react";

export const MAX_PHOTOS = 3;

export default function PhotoPicker({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  function add(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    onChange([...files, ...picked].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }

  return (
    <div className="flex flex-wrap gap-3">
      {urls.map((u, i) => (
        <div key={u} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(files.filter((_, j) => j !== i))}
            aria-label={`Remove photo ${i + 1}`}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm text-white"
          >
            &times;
          </button>
        </div>
      ))}
      {files.length < MAX_PHOTOS && (
        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand text-brand transition hover:bg-brand-light">
          <span className="text-3xl leading-none">+</span>
          <span className="mt-1 text-xs font-bold">Add photo</span>
          <input type="file" accept="image/*" multiple onChange={add} className="sr-only" />
        </label>
      )}
    </div>
  );
}