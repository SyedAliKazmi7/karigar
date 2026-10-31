import Link from "next/link";
import Icon from "../components/Icon";
import ServiceGrid from "../components/ServiceGrid";

const wrap = "mx-auto max-w-[1200px] px-5 sm:px-8";
const SHIELD = "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z";
const TAG = "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01";
const STAR = "M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 18l-6.3 3.5 1.6-7.2L2 9.6 9 9z";
const CHECK = "M5 12l5 5L20 7";

const steps = [
  { n: "1", t: "Post a request", d: "Describe the job, address and budget" },
  { n: "2", t: "Compare offers", d: "Professionals send you their price" },
  { n: "3", t: "Choose a pro", d: "Pick by rating and price" },
  { n: "4", t: "Job done", d: "Pay in cash, then leave a rating" },
];

const why = [
  { icon: SHIELD, t: "Verified professionals", d: "Every provider is checked by our team before joining." },
  { icon: TAG, t: "Transparent pricing", d: "Compare offers and agree the price before work starts." },
  { icon: STAR, t: "Rated and reviewed", d: "Real ratings help you choose the right person." },
];

const serviceNames = ["Plumber", "Electrician", "Maid", "AC technician", "Carpenter", "Painter"];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero-bg">
        <div className={`${wrap} grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_520px] lg:py-20`}>
          <div>
            <span className="anim-up inline-block rounded-full bg-[#d9efe8] px-3.5 py-1.5 text-xs font-bold text-[#0a4a40]">
              Verified professionals near you
            </span>
            <h1 className="anim-up-2 mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[58px] lg:leading-[1.06]">
              Trusted home services,{" "}
              <span className="bg-[linear-gradient(transparent_62%,#f5a524_62%)] text-brand">
                one request
              </span>{" "}
              away
            </h1>
            <p className="anim-up-2 mt-5 max-w-[520px] text-base leading-relaxed text-muted sm:text-lg">
              Post your job, compare offers from verified professionals and hire the one you like.
            </p>

            <div className="anim-up-3 mt-8 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-lg sm:flex-row">
              <label htmlFor="service" className="sr-only">Service</label>
              <select id="service" className="h-[50px] flex-1 rounded-xl bg-transparent px-4 text-[15px] outline-none">
                {serviceNames.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <label htmlFor="area" className="sr-only">Your area</label>
              <input
                id="area"
                placeholder="Your area"
                className="h-[50px] flex-1 rounded-xl bg-transparent px-4 text-[15px] outline-none"
              />
              <Link
                href="/requests/new"
                className="flex h-[50px] items-center justify-center rounded-xl bg-accent px-6 font-bold text-[#2a1a00] transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Find a pro
              </Link>
            </div>

            <ul className="anim-up-3 mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              {["Verified professionals", "Choose your price", "Pay after the job"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Icon d={CHECK} size={18} className="text-[#1eaa78]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Hero visual */}
          <div className="relative hidden h-[480px] overflow-hidden rounded-[36px] bg-brand lg:block">
            <div className="spin-slow absolute -right-[90px] -top-[90px] h-[320px] w-[320px] rounded-full border-2 border-dashed border-[#2a7a6b]" />
            <div className="absolute -right-[60px] -top-[60px] h-[260px] w-[260px] rounded-full bg-[#0e6354]" />
            <div className="absolute -bottom-[70px] -left-[70px] h-[240px] w-[240px] rounded-full bg-accent" />

            <div className="float-a absolute left-7 top-11 w-[260px] rounded-2xl bg-white p-[18px] shadow-xl">
              <p className="text-xs text-muted">New request</p>
              <p className="font-bold">Plumber &middot; KH-000123</p>
              <span className="mt-2.5 inline-block rounded-full bg-[#fdefd0] px-3 py-1 text-xs font-bold text-[#6b4200]">
                3 offers received
              </span>
            </div>

            <div className="float-b absolute right-7 top-[176px] w-[300px] rounded-2xl bg-white p-[18px] shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-brand-light font-extrabold text-brand">
                  PA
                </div>
                <div className="flex-1">
                  <p className="font-bold">Provider A</p>
                  <p className="text-[13px] text-muted">4.8 &middot; Verified</p>
                </div>
                <p className="font-bold">Rs 1,400</p>
              </div>
              <div className="mt-3.5 flex h-[38px] items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
                Accept offer
              </div>
            </div>

            <div className="float-a absolute bottom-[38px] left-10 flex w-[300px] items-center gap-3 rounded-2xl bg-white p-[18px] shadow-xl">
              <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-[#1eaa78]" />
              <div>
                <p className="font-bold">On the way</p>
                <p className="text-[13px] text-muted">Arriving in 30 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-24 bg-white py-14 sm:py-20">
        <div className={wrap}>
          <span className="rounded-full bg-[#d9efe8] px-3.5 py-1.5 text-xs font-bold text-[#0a4a40]">Services</span>
          <h2 className="mt-3.5 text-3xl font-extrabold tracking-tight sm:text-4xl">Everything your home needs</h2>
          <p className="mb-9 mt-2 text-muted">Skilled professionals for every household job.</p>
          <ServiceGrid />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={`${wrap} scroll-mt-24 py-14 sm:py-20`}>
        <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">How Karigar works</h2>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-brand text-[22px] font-extrabold text-white ring-8 ring-brand-light">
                {s.n}
              </div>
              <h3 className="text-lg font-bold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Karigar */}
      <section className="bg-white py-14 sm:py-20">
        <div className={wrap}>
          <h2 className="mb-9 text-3xl font-extrabold tracking-tight sm:text-4xl">Why choose Karigar</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {why.map((w) => (
              <div
                key={w.t}
                className="group rounded-3xl border border-gray-200 bg-white p-7 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand-light text-brand transition group-hover:bg-accent group-hover:text-[#2a1a00]">
                  <Icon d={w.icon} />
                </div>
                <h3 className="mt-5 text-xl font-bold">{w.t}</h3>
                <p className="mt-2 leading-relaxed text-muted">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For professionals */}
      <section className={`${wrap} pt-14 sm:pt-20`}>
        <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-[#fdefd0] p-8 md:flex-row md:items-center md:px-12 md:py-10">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Are you a skilled professional?</h2>
            <p className="mt-2 text-[#6b4200]">Join Karigar and get jobs near you.</p>
          </div>
          <Link
            href="/join"
            className="rounded-xl bg-brand px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Join as a pro
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${wrap} py-14 sm:py-20`}>
        <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-brand p-8 text-white md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Get your first job done today</h2>
            <p className="mt-2 opacity-80">It takes less than 2 minutes.</p>
          </div>
          <Link
            href="/requests/new"
            className="rounded-xl bg-accent px-6 py-3 font-bold text-[#2a1a00] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Request a service
          </Link>
        </div>
      </section>
    </main>
  );
}