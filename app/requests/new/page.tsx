"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { uploadRequestPhotos } from "../../../lib/photos";
import { useAuth } from "../../../components/AuthProvider";
import Icon from "../../../components/Icon";
import PhotoPicker from "../../../components/PhotoPicker";
import type { LatLng } from "../../../components/MapPicker";

const MapPicker = dynamic(() => import("../../../components/MapPicker"), {
  ssr: false,
  loading: () => <div className="skeleton h-[320px] rounded-2xl" role="status" aria-label="Loading map" />,
});

type Category = { id: number; name: string; description: string | null };

const icons: Record<string, string> = {
  Plumber: "M12 3C9 8 6 11 6 15a6 6 0 0012 0c0-4-3-7-6-12z",
  Electrician: "M13 2L4 14h7l-1 8 9-12h-7z",
  Maid: "M3 11l9-8 9 8v9H3z",
  "AC technician": "M12 2v20M3 7l18 10M21 7L3 17",
  Carpenter: "M3 8h18v8H3zM7 8v4M11 8v3M15 8v4",
  Painter: "M4 20c4 0 5-2 5-4l9-9-3-3-9 9c-2 0-4 1-4 4z",
};

const input =
  "h-[50px] w-full rounded-xl border border-gray-300 bg-white px-4 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light";
const label = "mb-1.5 mt-5 block text-sm font-bold";

export default function NewRequestPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Rawalpindi");
  const [when, setWhen] = useState("");
  const [budget, setBudget] = useState("");
  const [pin, setPin] = useState<LatLng | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, description")
      .eq("active", true)
      .order("id")
      .then(({ data }) => {
        const list = (data ?? []) as Category[];
        setCategories(list);
        const wanted = Number(new URLSearchParams(window.location.search).get("category"));
        if (wanted && list.some((c) => c.id === wanted)) setCategoryId(wanted);
      });
  }, []);

  function locateMe() {
    setError("");
    if (!navigator.geolocation) return setError("Your browser does not support location.");
    navigator.geolocation.getCurrentPosition(
      (p) => setPin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("Could not get your location. Please click on the map instead."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (!categoryId) return setError("Please choose a service.");
    if (description.trim().length < 10) return setError("Please describe the problem (at least 10 characters).");
    if (address.trim().length < 5) return setError("Please enter your address.");
    if (!city.trim()) return setError("Please enter your city.");
    const amount = budget.trim() === "" ? null : Number(budget);
    if (amount !== null && (!Number.isInteger(amount) || amount <= 0))
      return setError("Budget must be a positive whole number.");

    setBusy(true);

    let paths: string[] = [];
    if (files.length > 0) {
      try {
        paths = await uploadRequestPhotos(user.id, files);
      } catch {
        setBusy(false);
        return setError("Could not upload the photos. Please try again, or remove the photos and submit.");
      }
    }

    const { error } = await supabase.from("service_requests").insert({
      customer_id: user.id,
      category_id: categoryId,
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      preferred_time: when ? new Date(when).toISOString() : null,
      budget: amount,
      latitude: pin ? Number(pin.lat.toFixed(6)) : null,
      longitude: pin ? Number(pin.lng.toFixed(6)) : null,
      photo_paths: paths,
    });
    setBusy(false);

    if (error) return setError(error.message);
    router.push("/requests?created=1");
  }

  if (loading || !user) {
    return (
      <div className="loader-wrap" role="status" aria-label="Loading">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8">
      <p className="text-sm text-muted">My requests / New request</p>
      <h1 className="anim-up mb-6 mt-1.5 text-4xl font-extrabold tracking-tight">New request</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={onSubmit} noValidate className="anim-up-2 rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">
          <h2 className="mb-3 text-base font-bold">Choose a service</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => {
              const on = c.id === categoryId;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  aria-pressed={on}
                  className={`rounded-2xl border-2 px-2 py-3.5 text-center text-[13px] font-bold transition ${
                    on ? "border-brand bg-brand-light" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Icon d={icons[c.name] ?? icons.Maid} size={22} className="mx-auto text-brand" />
                  <span className="mt-1.5 block">{c.name}</span>
                </button>
              );
            })}
          </div>

          <label htmlFor="desc" className={label}>What is the problem?</label>
          <textarea
            id="desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="For example: Water is leaking from the kitchen sink."
            className="w-full rounded-xl border border-gray-300 bg-white p-4 text-[15px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-light"
          />

          <p className={label}>Photos of the problem (optional, up to 3)</p>
          <PhotoPicker files={files} onChange={setFiles} />

          <div className="grid gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="address" className={label}>Address</label>
              <input id="address" className={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, street, area" autoComplete="street-address" />
            </div>
            <div>
              <label htmlFor="city" className={label}>City</label>
              <input id="city" className={input} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label htmlFor="when" className={label}>Preferred date and time (optional)</label>
              <input id="when" type="datetime-local" className={input} value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div>
              <label htmlFor="budget" className={label}>Budget in PKR (optional)</label>
              <input id="budget" inputMode="numeric" className={input} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="1500" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold">Pin your location (optional)</p>
            <button type="button" onClick={locateMe} className="text-sm font-bold text-brand hover:underline">
              Use my current location
            </button>
          </div>
          <p className="mb-2 mt-1 text-xs text-muted">
            Click on the map to place the pin. This helps the professional find your home.
          </p>
          <MapPicker value={pin} onChange={setPin} />
          {pin && (
            <button type="button" onClick={() => setPin(null)} className="mt-2 text-xs font-bold text-red-600 hover:underline">
              Remove pin
            </button>
          )}

          {error && <p className="mt-5 text-sm font-semibold text-red-600">{error}</p>}

          <div className="mt-7 flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="h-[52px] rounded-xl bg-accent px-8 font-bold text-[#2a1a00] transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            >
              {busy ? (<><span className="spinner spinner-sm" />Sending...</>) : "Submit request"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="h-[52px] rounded-xl border border-gray-300 px-6 font-bold text-brand transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>

        <aside className="anim-up-3 space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold">What happens next</h2>
            {["Our team receives your request", "Professionals send you their offers", "You choose the best offer"].map((t, i) => (
              <div key={t} className="mb-3.5 flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm">{t}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-[#c9e5da] bg-brand-light p-6">
            <p className="text-sm font-bold">Your privacy</p>
            <p className="mt-1.5 text-[13px] text-muted">
              Your phone number is shared with a professional only after you accept their offer. Your photos are private.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}