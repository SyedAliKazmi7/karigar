import Link from "next/link";

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="hero-bg">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-14">
        <Link href="/" className="text-sm text-muted hover:text-brand">&larr; Home</Link>
        <h1 className="mb-2 mt-3 text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mb-8 text-sm text-muted">Last updated: {updated}</p>
        <article className="space-y-8 rounded-3xl border border-gray-200 bg-white p-6 leading-relaxed sm:p-8 [&_a]:font-bold [&_a]:text-brand [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          {children}
        </article>
      </div>
    </main>
  );
}