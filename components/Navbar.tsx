"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { useAuth } from "./AuthProvider";

const links = [
  { href: "/#services", label: "Services" },
  { href: "/#how", label: "How it works" },
  { href: "/requests", label: "My requests" },
];

const staffLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/complaints", label: "Complaints" },
];

const outline =
  "rounded-xl border border-gray-300 px-5 py-2.5 text-[15px] font-bold text-brand transition hover:bg-gray-50";
const cta =
  "rounded-xl bg-accent px-5 py-2.5 text-[15px] font-bold text-[#2a1a00] transition hover:-translate-y-0.5 hover:shadow-lg";

export default function Navbar() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isStaff = profile?.role === "admin" || profile?.role === "dispatcher";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-[76px] max-w-[1200px] items-center gap-6 px-5 sm:px-8" aria-label="Main">
        <Link href="/" aria-label="Karigar home" className="shrink-0" onClick={close}>
          <Logo />
        </Link>

        {/* Desktop links */}
        <ul className="hidden flex-1 gap-5 whitespace-nowrap text-[15px] font-semibold text-muted xl:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition hover:text-brand">
                {l.label}
              </Link>
            </li>
          ))}
          {isStaff &&
            staffLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-brand transition hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
        </ul>

        {/* Desktop actions */}
        <div className="ml-auto hidden shrink-0 items-center gap-3 whitespace-nowrap xl:flex">
          {!loading && user ? (
            <>
              <span className="hidden text-[15px] font-semibold 2xl:inline">Hi, {firstName}</span>
              <button onClick={handleLogout} className={outline}>
                Log out
              </button>
            </>
          ) : (
            !loading && (
              <>
                <Link href="/login" className={outline}>Log in</Link>
                <Link href="/signup" className={outline}>Sign up</Link>
              </>
            )
          )}
          <Link href="/requests/new" className={cta}>
            Request a service
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-gray-300 text-brand xl:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-gray-200 bg-white px-5 pb-6 pt-3 shadow-lg sm:px-8 xl:hidden">
          <ul className="text-[17px] font-semibold">
            {[...links, ...(isStaff ? staffLinks : [])].map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="block rounded-xl px-3 py-3 transition hover:bg-gray-50">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-4">
            <Link href="/requests/new" onClick={close} className={`${cta} text-center`}>
              Request a service
            </Link>
            {!loading && user && (
              <>
                <p className="text-center text-sm text-muted">Signed in as {firstName}</p>
                <button onClick={handleLogout} className={outline}>
                  Log out
                </button>
              </>
            )}
            {!loading && !user && (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" onClick={close} className={`${outline} text-center`}>Log in</Link>
                <Link href="/signup" onClick={close} className={`${outline} text-center`}>Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}