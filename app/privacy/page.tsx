import LegalPage from "../../components/LegalPage";
import { SITE } from "../../lib/site";

export const metadata = { title: "Privacy Policy | Karigar" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={SITE.updated}>
      <section>
        <h2>1. Who we are</h2>
        <p>
          {SITE.name} is a service that connects customers with independent home service
          professionals (such as plumbers, electricians and maids) in {SITE.area}. This policy
          explains what personal information we collect, why we collect it and how we protect it.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <ul>
          <li><b>Account details:</b> your name, mobile number, email address and password. Your password is stored in a protected form by our authentication provider and we cannot read it.</li>
          <li><b>Request details:</b> the service you need, a description of the problem, your address, city, preferred time and budget.</li>
          <li><b>Optional details:</b> a pin on a map and up to three photos of the problem. You choose whether to add these.</li>
          <li><b>Activity:</b> offers you send or receive, job status updates, ratings, reviews, complaints and the notifications we show you in the app.</li>
          <li><b>Professionals:</b> name, WhatsApp number, login email, services, areas, experience and any details we collect to verify them, plus the offers they send and the ratings they receive.</li>
          <li><b>Technical data:</b> basic information such as device and browser type, which our hosting and database providers may record to keep the service running.</li>
        </ul>
      </section>

      <section>
        <h2>3. How we use your information</h2>
        <ul>
          <li>To create your account and run your requests.</li>
          <li>To show jobs to suitable professionals and to show offers to customers.</li>
          <li>To send you notifications about new offers, new jobs, offer decisions and job progress.</li>
          <li>To call or message you about your request, offers and visit.</li>
          <li>To verify professionals, handle complaints and keep customers and professionals safe.</li>
          <li>To improve the service and to meet legal obligations.</li>
        </ul>
      </section>

      <section>
        <h2>4. Who can see your information</h2>
        <ul>
          <li><b>Our team</b> (administrators and dispatchers) can see requests, contact details, location pins and photos so that they can manage jobs.</li>
          <li><b>Professionals</b> who match a request can see only the job details needed to quote a price (service, problem, city and budget). Your name, phone number, exact address, map pin and photos are shared only with the professional whose offer you accept, and only as needed to complete the visit.</li>
          <li><b>Customers</b> see a professional&apos;s name, rating, price and arrival time on their offer. A professional&apos;s phone number is not shown to customers.</li>
          <li><b>Service providers</b> that help us run {SITE.name}: our database, authentication and file storage provider (Supabase), our hosting provider, OpenStreetMap (map display) and WhatsApp (messages to professionals).</li>
          <li>We do not sell your personal information.</li>
        </ul>
      </section>

      <section>
        <h2>5. Photos and location</h2>
        <p>
          Photos are kept in private storage. They are visible only to you, our team and the
          professional whose offer you accept. They are never published. Your map pin is optional
          and follows the same rule.
        </p>
      </section>

      <section>
        <h2>6. How long we keep information</h2>
        <p>
          We keep your information while your account is active and for as long as needed to
          handle complaints, keep records and meet legal requirements. You can ask us to delete
          your account and data at any time.
        </p>
      </section>

      <section>
        <h2>7. Security</h2>
        <p>
          We use encrypted connections, access controls that limit each user to their own data,
          limits on repeated actions to prevent abuse, and private file storage. No online service
          is completely secure, but we work to protect your information.
        </p>
      </section>

      <section>
        <h2>8. Your choices</h2>
        <p>
          You can ask to see, correct or delete the information we hold about you. To do this,
          email us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>{SITE.name} is for adults aged 18 and over. We do not knowingly collect information from children.</p>
      </section>

      <section>
        <h2>10. Changes to this policy</h2>
        <p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>
      </section>

      <section>
        <h2>11. Contact us</h2>
        <p>
          Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <br />
          Phone: {SITE.phone}
        </p>
      </section>
    </LegalPage>
  );
}