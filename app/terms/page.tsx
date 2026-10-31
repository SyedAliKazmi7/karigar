import LegalPage from "../../components/LegalPage";
import { SITE } from "../../lib/site";

export const metadata = { title: "Terms of Service | Karigar" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={SITE.updated}>
      <section>
        <h2>1. About {SITE.name}</h2>
        <p>
          {SITE.name} helps customers find independent home service professionals. We are not
          the employer of these professionals, and we do not perform the services ourselves. By
          using {SITE.name} you agree to these terms.
        </p>
      </section>

      <section>
        <h2>2. Your account</h2>
        <ul>
          <li>You must be 18 or older.</li>
          <li>You must give correct information and keep your password private.</li>
          <li>You are responsible for activity on your account.</li>
        </ul>
      </section>

      <section>
        <h2>3. Requests and offers</h2>
        <p>
          When you post a request, you should describe the job honestly and completely. Our team
          contacts professionals on your behalf, and the offers you see are prices given by those
          professionals. When you accept an offer, you agree to the job with that professional
          at the price shown.
        </p>
      </section>

      <section>
        <h2>4. Prices and payment</h2>
        <ul>
          <li>Prices are in Pakistani Rupees (PKR).</li>
          <li>Unless we say otherwise, you pay the professional directly, in cash, after the job is done.</li>
          <li>Any extra work or materials must be agreed with the professional before they start.</li>
        </ul>
      </section>

      <section>
        <h2>5. Cancellations</h2>
        <p>
          You can cancel a request at no cost before you accept an offer. After you accept an
          offer, please tell us as early as possible if you need to cancel. Repeated no-shows or
          late cancellations may lead to limits on your account.
        </p>
      </section>

      <section>
        <h2>6. Professionals</h2>
        <p>
          Our team checks professionals before they receive jobs, but we cannot guarantee the
          quality, safety or timing of any service. Professionals work independently and are
          responsible for their own work, tools and conduct.
        </p>
      </section>

      <section>
        <h2>7. Ratings, reviews and complaints</h2>
        <p>
          Please leave honest ratings and reviews. We may hide content that is abusive, false or
          unlawful. If something goes wrong, use the report option on your request and we will
          look into it.
        </p>
      </section>

      <section>
        <h2>8. Acceptable use</h2>
        <ul>
          <li>Do not post false or misleading requests.</li>
          <li>Do not harass or threaten professionals, customers or our team.</li>
          <li>Do not use {SITE.name} for anything illegal.</li>
          <li>Do not try to access other people&apos;s data or disrupt the service.</li>
        </ul>
      </section>

      <section>
        <h2>9. Our responsibility</h2>
        <p>
          To the extent allowed by law, {SITE.name} is not responsible for the quality of work
          done by professionals, for damage or loss caused during a job, or for indirect losses.
          Nothing in these terms limits any responsibility that cannot be limited by law.
        </p>
      </section>

      <section>
        <h2>10. Suspending accounts</h2>
        <p>
          We may suspend or close an account that breaks these terms or puts others at risk. You
          can stop using {SITE.name} and ask us to delete your account at any time.
        </p>
      </section>

      <section>
        <h2>11. Governing law</h2>
        <p>These terms are governed by the laws of Pakistan.</p>
      </section>

      <section>
        <h2>12. Changes and contact</h2>
        <p>
          We may update these terms. The date at the top shows when they were last changed. For
          questions, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </section>
    </LegalPage>
  );
}