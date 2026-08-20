export const metadata = {
  title: "Terms of Service — Hollywood East PA",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Terms of Service</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: August 20, 2026</p>

      <div className="prose-terms mt-8 space-y-6 text-sm leading-6 text-slate-700">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of the Hollywood East PA
          website and platform (the &quot;Platform&quot;), operated by{" "}
          <strong>[Legal entity name — e.g. Hollywood East PA LLC]</strong> (&quot;we,&quot;
          &quot;us,&quot; or &quot;the Company&quot;). By creating an account or using the
          Platform, you agree to these Terms. If you do not agree, do not use the Platform.
        </p>

        <section>
          <h2 className="text-base font-semibold text-slate-900">1. What the Platform Is</h2>
          <p className="mt-2">
            Hollywood East PA is a matching and dispatch service that connects film and TV
            productions (&quot;Producers&quot;) with production assistants and coordinators
            (&quot;PAs&quot;) in New York and New Jersey. Producers post gigs describing role,
            location, call time, and rate. The Platform automatically invites PAs whose profile
            matches the gig&apos;s state and role, and Producers may also invite specific PAs
            directly. The first PA to accept a given opening is dispatched to it.
          </p>
          <p className="mt-2">
            <strong>The Platform is a matching tool, not an employer, staffing agency, or party
            to any work arrangement.</strong> Any agreement to perform work — including pay rate,
            work conditions, and the legal relationship between a Producer and a PA (e.g.
            employee vs. independent contractor) — is solely between the Producer and the PA. We
            do not process payroll or payments through the Platform, do not supervise work
            performed, and make no representation about a user&apos;s employment classification.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">2. Eligibility &amp; Accounts</h2>
          <p className="mt-2">
            You must be at least 18 years old and legally permitted to work in the United States
            to create a PA account. You are responsible for the accuracy of the information in
            your profile and for keeping your login credentials secure. You are responsible for
            all activity that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            3. PA Verification (&quot;Set-Ready&quot; Status)
          </h2>
          <p className="mt-2">
            PAs may be asked to submit tax-residency and other verification documents as part of
            onboarding. This documentation is used solely to determine dispatch eligibility (for
            example, state tax-credit compliance) and is reviewed by Platform administrators. You
            represent that any document you upload is authentic, current, and belongs to you.
            Submitting false or altered documents is grounds for immediate account termination.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">4. Gig Postings &amp; Dispatch</h2>
          <p className="mt-2">
            Producers are solely responsible for the accuracy of gig postings (role, rate,
            location, call time) and for honoring the terms of any gig a PA accepts. Producers
            may cancel or edit a posted gig; PAs who already accepted will be notified of
            cancellations or material changes, but the Platform is not responsible for losses
            resulting from a cancelled or changed gig.
          </p>
          <p className="mt-2">
            Acceptance of a gig through the Platform is not a guarantee of payment, work
            conditions, or continued engagement — those terms are set by the Producer directly
            with the PA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">5. Fees</h2>
          <p className="mt-2">
            <strong>[Describe current fee model here, e.g. &quot;Use of the Platform is
            currently free for Producers and PAs&quot; or a placement/subscription fee
            structure.]</strong> We will provide notice before introducing or changing any fees.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">6. Acceptable Use</h2>
          <p className="mt-2">
            You agree not to: misrepresent your identity, role, or qualifications; use the
            Platform to solicit work or workers outside its intended matching process in a way
            that circumvents Platform safeguards; upload false verification documents; or
            interfere with the Platform&apos;s operation or other users&apos; accounts.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">7. Disclaimers &amp; Limitation of Liability</h2>
          <p className="mt-2">
            The Platform is provided &quot;as is&quot; without warranties of any kind. We do not
            guarantee that any gig will be filled, that any PA will be available, or that
            information submitted by other users is accurate. To the fullest extent permitted by
            law, the Company is not liable for indirect, incidental, or consequential damages
            arising from your use of the Platform, or for disputes, injuries, non-payment, or
            other issues arising from a work engagement between a Producer and a PA.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">8. Termination</h2>
          <p className="mt-2">
            We may suspend or terminate your account at any time for violation of these Terms.
            You may stop using the Platform and request account deletion at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">9. Changes to These Terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. Continued use of the Platform after an
            update constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">10. Governing Law</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the State of{" "}
            <strong>[State — e.g. New York]</strong>, without regard to conflict-of-law
            principles.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">11. Contact</h2>
          <p className="mt-2">
            Questions about these Terms can be sent to{" "}
            <strong>[contact email]</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
