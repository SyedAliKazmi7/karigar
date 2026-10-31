import Link from "next/link";
import Logo from "./Logo";
import Year from "./Year";
import { SITE } from "../lib/site";

const services = ["Plumber", "Electrician", "Maid", "AC technician", "Carpenter", "Painter"];

const company = [
  { label: "How it works", href: "/#how" },
  { label: "Why Karigar", href: "/#services" },
  { label: "Join as a professional", href: "/join" },
];

const support = [
  { label: "My requests", href: "/requests" },
  { label: "Log in", href: "/login" },
  { label: "Create an account", href: "/signup" },
];

const colTitle = "mb-4 text-sm font-bold uppercase tracking-wider text-white";
const link = "text-[15px] text-white/70 transition hover:text-accent";

export default function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-accent bg-brand-dark text-white">
      <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 sm:px-8 sm:pt-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="Karigar home">
              <Logo light size={40} />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
              Pakistan&apos;s trusted way to hire skilled home service professionals. Post a job,
              compare offers and choose the right person.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Facebook", "Instagram", "WhatsApp"].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold text-white/80 transition hover:border-accent hover:text-accent"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <nav aria-label="Services">
            <h2 className={colTitle}>Services</h2>
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s}>
                  <Link href="/#services" className={link}>
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company + account */}
          <nav aria-label="Company">
            <h2 className={colTitle}>Company</h2>
            <ul className="space-y-3">
              {company.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className={link}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className={`${colTitle} mt-8`}>Account</h2>
            <ul className="space-y-3">
              {support.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className={link}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className={colTitle}>Contact us</h2>
            <ul className="space-y-3 text-[15px] text-white/70">
              <li>
                <span className="block text-xs uppercase tracking-wider text-white/50">Email</span>
                <a href={`mailto:${SITE.email}`} className="break-all transition hover:text-accent">{SITE.email}</a>
              </li>
              <li>
                <span className="block text-xs uppercase tracking-wider text-white/50">Phone</span>
                <span>{SITE.phone}</span>
              </li>
              <li>
                <span className="block text-xs uppercase tracking-wider text-white/50">Service area</span>
                <span>{SITE.area}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row md:items-center">
          <p>
            &copy; <Year /> Karigar. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li><Link href="/privacy" className="transition hover:text-accent">Privacy Policy</Link></li>
            <li><Link href="/terms" className="transition hover:text-accent">Terms of Service</Link></li>
            <li><Link href="/cookies" className="transition hover:text-accent">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}