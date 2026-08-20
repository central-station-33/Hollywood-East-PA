export const metadata = {
  title: "Privacy Policy — Hollywood East PA",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: August 20, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-slate-700">
        <p>
          This Privacy Policy explains how{" "}
          <strong>[Legal entity name — e.g. Hollywood East PA LLC]</strong> (&quot;we,&quot;
          &quot;us&quot;) collects, uses, and protects information when you use the Hollywood
          East PA platform (the &quot;Platform&quot;).
        </p>

        <section>
          <h2 className="text-base font-semibold text-slate-900">1. Information We Collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account information:</strong> name, email, phone number, password, and
              account role (Producer or PA).
            </li>
            <li>
              <strong>PA profile information:</strong> home state, eligible role types, and
              other onboarding details used for gig matching.
            </li>
            <li>
              <strong>Verification documents:</strong> tax-residency and related documents PAs
              upload to establish dispatch eligibility. These are stored in a private,
              access-restricted file store and are reviewed only by Platform administrators for
              verification purposes.
            </li>
            <li>
              <strong>Gig and dispatch activity:</strong> gigs posted, invitations sent,
              acceptances, declines, and cancellations.
            </li>
            <li>
              <strong>Communications:</strong> in-app notifications and, where enabled, email
              (and in the future, SMS) sent to notify you of gig invites, acceptances, edits, and
              cancellations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. How We Use Information</h2>
          <p className="mt-2">We use the information above to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Match PAs to gigs based on state, role, and Set-Ready status</li>
            <li>Verify PA eligibility to be dispatched to a gig</li>
            <li>Notify users of gig invitations, acceptances, edits, and cancellations</li>
            <li>Operate, secure, and improve the Platform</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">3. How Information Is Shared</h2>
          <p className="mt-2">
            When a PA accepts a gig, we share their name and phone number with the Producer who
            posted it, so the two parties can coordinate directly. We do not sell personal
            information. We share data with the service providers that operate the Platform on
            our behalf, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase (database, authentication, and secure document storage)</li>
            <li>Vercel (application hosting)</li>
            <li>Resend (transactional email delivery)</li>
            <li>
              <strong>[Twilio (SMS delivery) — once enabled]</strong>
            </li>
          </ul>
          <p className="mt-2">
            These providers process data only as needed to provide their service to us and are
            not permitted to use it for their own purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Verification Document Handling</h2>
          <p className="mt-2">
            Tax-residency and eligibility documents are among the most sensitive information we
            collect. These files are stored in a private storage bucket that is not publicly
            accessible, and access is restricted to the uploading PA and Platform administrators
            performing verification. We retain these documents only as long as needed for
            verification and legal/compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Data Retention</h2>
          <p className="mt-2">
            We retain account and activity data for as long as your account is active, and for a
            reasonable period afterward to comply with legal obligations, resolve disputes, and
            enforce our agreements. You may request deletion of your account and associated data
            by contacting us, subject to records we are required to keep by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">6. Your Rights</h2>
          <p className="mt-2">
            You may access, correct, or request deletion of your personal information by
            contacting us at <strong>[contact email]</strong>. Depending on your state of
            residence, you may have additional rights under applicable privacy law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">7. Security</h2>
          <p className="mt-2">
            We use industry-standard safeguards — including encrypted storage, access controls,
            and private file buckets for sensitive documents — to protect information on the
            Platform. No system is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">8. Children&apos;s Privacy</h2>
          <p className="mt-2">
            The Platform is not directed to, and we do not knowingly collect information from,
            anyone under 18.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">9. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. We will update the &quot;Last
            updated&quot; date above when we do.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
          <p className="mt-2">
            Questions about this Privacy Policy can be sent to{" "}
            <strong>[contact email]</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
