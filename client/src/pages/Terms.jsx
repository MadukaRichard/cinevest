/**
 * ===========================================
 * Terms of Service Page
 * ===========================================
 */

import SEO from '../components/ui/SEO';

function Terms() {
  return (
    <div className="min-h-screen py-20 px-4">
      <SEO title="Terms of Service" description="Read CineVest's terms and conditions governing your use of the platform." />
      <div className="container-custom max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-10">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using CineVest ("the Platform"), you agree to be
              bound by these Terms of Service. If you do not agree with any part
              of these terms, you may not use the Platform. These terms apply to
              all users, including investors, filmmakers, and visitors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CineVest provides a digital platform that connects film investors
              with film projects seeking funding. We facilitate investment
              opportunities, provide portfolio tracking, and enable communication
              between investors and project teams. CineVest does not provide
              financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              3. User Accounts
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You must create an account to access most features of the Platform.
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. You agree to provide accurate and complete information
              during registration and to update your information to keep it
              current.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              4. Investment Risks
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All investments carry risk. Past performance is not indicative of
              future results. Film investments are speculative in nature and may
              result in partial or total loss of invested capital. Expected ROI
              figures are projections and are not guaranteed. You should only
              invest money you can afford to lose. We recommend consulting with
              a qualified financial advisor before making investment decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              5. Prohibited Activities
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Using the Platform for any illegal purpose</li>
              <li>Attempting to gain unauthorized access to other user accounts</li>
              <li>Manipulating or interfering with the Platform's functionality</li>
              <li>Posting false, misleading, or fraudulent content</li>
              <li>Using automated systems to access the Platform without permission</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              6. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on CineVest, including text, graphics, logos, images,
              and software, is the property of CineVest or its content suppliers
              and is protected by intellectual property laws. You may not
              reproduce, distribute, or create derivative works without our
              express written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              7. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CineVest shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of the
              Platform. Our total liability shall not exceed the amount you have
              paid to CineVest in the twelve months prior to the event giving
              rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              8. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will
              notify users of significant changes via email or through the
              Platform. Continued use of the Platform after changes constitutes
              acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              9. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact
              us at{' '}
              <a
                href="mailto:legal@cinevest.com"
                className="text-primary-500 hover:underline"
              >
                legal@cinevest.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Terms;
