/**
 * ===========================================
 * Privacy Policy Page
 * ===========================================
 */

import SEO from '../components/ui/SEO';

function Privacy() {
  return (
    <div className="min-h-screen py-20 px-4">
      <SEO title="Privacy Policy" description="Learn how CineVest collects, uses, and protects your personal information." />
      <div className="container-custom max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-10">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Account Information:</strong>{' '}
                Name, email address, and password when you create an account
              </li>
              <li>
                <strong className="text-foreground">Wallet Information:</strong>{' '}
                Cryptocurrency wallet address when you connect a wallet
              </li>
              <li>
                <strong className="text-foreground">Investment Data:</strong>{' '}
                Transaction history, investment amounts, and portfolio information
              </li>
              <li>
                <strong className="text-foreground">Communications:</strong>{' '}
                Messages you send through our chat platform
              </li>
              <li>
                <strong className="text-foreground">Usage Data:</strong>{' '}
                Information about how you interact with the Platform
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide, maintain, and improve our services</li>
              <li>To process investment transactions and track your portfolio</li>
              <li>To send you verification emails, security alerts, and notifications</li>
              <li>To respond to your comments, questions, and support requests</li>
              <li>To detect, prevent, and address fraud and security issues</li>
              <li>To comply with legal obligations and enforce our policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              3. Information Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your
              information only in the following circumstances: with your consent,
              to comply with legal obligations, to protect our rights and safety,
              with service providers who assist in our operations (subject to
              confidentiality agreements), and in connection with a merger or
              acquisition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              4. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your
              personal information. This includes encryption of data in transit
              (TLS/SSL), secure password hashing (bcrypt), JWT-based
              authentication, rate limiting to prevent abuse, and regular
              security audits. However, no method of transmission over the
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              5. Cookies and Tracking
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use local storage and session storage to maintain your
              authentication state and preferences. We do not use third-party
              tracking cookies. Essential storage includes authentication tokens
              and theme preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              6. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your jurisdiction, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Data portability — receive your data in a structured format</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              7. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is
              active or as needed to provide you services. Investment records are
              retained as required by applicable financial regulations. You may
              request account deletion by contacting us, after which we will
              delete or anonymize your data within 30 days, unless we are legally
              required to retain it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              8. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CineVest is not intended for users under the age of 18. We do not
              knowingly collect personal information from children. If we
              discover that we have collected information from a child, we will
              promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              9. Changes to this Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify
              you of significant changes via email or through a prominent notice
              on the Platform. Your continued use of the Platform after changes
              are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              10. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise
              your rights, please contact us at{' '}
              <a
                href="mailto:privacy@cinevest.com"
                className="text-primary-500 hover:underline"
              >
                privacy@cinevest.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
