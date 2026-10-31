import LegalPage from "../../components/LegalPage";
import { SITE } from "../../lib/site";

export const metadata = { title: "Cookie Policy | Karigar" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated={SITE.updated}>
      <section>
        <h2>What we store in your browser</h2>
        <p>
          {SITE.name} stores a small login token in your browser so that you stay signed in. It
          is needed for the service to work and is removed when you log out.
        </p>
      </section>

      <section>
        <h2>What we do not use</h2>
        <p>
          We do not use advertising cookies, and we do not currently use analytics or tracking
          tools. If this changes, we will update this page.
        </p>
      </section>

      <section>
        <h2>Third-party content</h2>
        <p>
          When you use the map on a request form, your browser loads map images from
          OpenStreetMap, which can see technical information such as your IP address.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can clear stored data at any time from your browser settings. This will log you
          out. Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </section>
    </LegalPage>
  );
}