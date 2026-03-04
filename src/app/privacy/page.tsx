import { Metadata } from "next";
import Link from "next/link";
import { WaveDivider } from "@/components/wave-divider";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how GroomLocal collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-brand-primary overflow-hidden">
      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
              Legal
            </p>
            <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 text-brand-primary">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-text-muted">
              Your privacy matters to us. Here&apos;s how we handle your
              information.
            </p>
          </div>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none space-y-10">
            <div>
              <p className="text-sm text-text-muted">
                Effective Date: March 1, 2026
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                1. Information We Collect
              </h2>
              <p className="text-text-muted leading-relaxed mb-3">
                We collect information you provide directly when using GroomLocal,
                including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-text-muted">
                <li>
                  <strong className="text-text">Account information</strong>{" "}
                  &mdash; email address and password when you create a business
                  owner account.
                </li>
                <li>
                  <strong className="text-text">Business listing data</strong>{" "}
                  &mdash; business name, address, phone number, services, hours,
                  and photos submitted by business owners through the claim or
                  profile editing process.
                </li>
                <li>
                  <strong className="text-text">Contact form submissions</strong>{" "}
                  &mdash; name, email, and message content when you use a contact
                  form on the site.
                </li>
                <li>
                  <strong className="text-text">Usage data</strong> &mdash;
                  pages visited, search queries, browser type, and device
                  information collected automatically through analytics tools.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-text-muted">
                <li>
                  To display and manage business listings in our directory.
                </li>
                <li>
                  To enable business owners to claim and manage their profiles.
                </li>
                <li>
                  To facilitate communication between pet parents and groomers.
                </li>
                <li>
                  To improve our site experience, features, and content.
                </li>
                <li>
                  To send service-related communications (account
                  confirmations, listing updates).
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                3. Information Sharing
              </h2>
              <p className="text-text-muted leading-relaxed mb-3">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-text-muted">
                <li>
                  <strong className="text-text">Service providers</strong> who
                  help us operate the site (hosting, analytics, email delivery).
                </li>
                <li>
                  <strong className="text-text">Business owners</strong> who
                  receive contact form submissions from pet parents through their
                  listing profiles.
                </li>
                <li>
                  <strong className="text-text">Legal authorities</strong> when
                  required by law or to protect our rights.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                4. Data Storage &amp; Security
              </h2>
              <p className="text-text-muted leading-relaxed">
                Your data is stored securely using Supabase infrastructure with
                encryption at rest and in transit. We use industry-standard
                security measures including HTTPS, secure authentication, and
                access controls to protect your information. However, no method
                of electronic transmission or storage is 100% secure, and we
                cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                5. Cookies &amp; Analytics
              </h2>
              <p className="text-text-muted leading-relaxed">
                We use essential cookies to maintain your session and
                authentication state. We may use analytics tools to understand
                how visitors use our site. These tools may collect anonymous
                usage data such as pages viewed, time on site, and referral
                sources. We do not use cookies for advertising or cross-site
                tracking.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                6. Your Rights
              </h2>
              <p className="text-text-muted leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-text-muted">
                <li>
                  Access, update, or delete your account information at any time.
                </li>
                <li>
                  Request removal of your business listing data.
                </li>
                <li>
                  Opt out of non-essential communications.
                </li>
                <li>
                  Request a copy of the personal data we hold about you.
                </li>
              </ul>
              <p className="text-text-muted leading-relaxed mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a
                  href="mailto:hello@groomlocal.com"
                  className="text-brand-accent hover:underline"
                >
                  hello@groomlocal.com
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                7. Third-Party Links
              </h2>
              <p className="text-text-muted leading-relaxed">
                Our directory listings may contain links to external websites
                (groomer websites, social media, etc.). We are not responsible
                for the privacy practices of these external sites. We encourage
                you to review their privacy policies independently.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                8. Children&apos;s Privacy
              </h2>
              <p className="text-text-muted leading-relaxed">
                GroomLocal is not directed at children under the age of 13. We do
                not knowingly collect personal information from children. If you
                believe a child has provided us with personal information, please
                contact us and we will promptly remove it.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                9. Changes to This Policy
              </h2>
              <p className="text-text-muted leading-relaxed">
                We may update this Privacy Policy from time to time. Changes
                will be posted on this page with an updated effective date. Your
                continued use of GroomLocal after changes constitutes acceptance of
                the revised policy.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                10. Contact Us
              </h2>
              <p className="text-text-muted leading-relaxed">
                If you have questions about this Privacy Policy, please reach
                out:
              </p>
              <p className="text-text-muted leading-relaxed mt-2">
                Email:{" "}
                <a
                  href="mailto:hello@groomlocal.com"
                  className="text-brand-accent hover:underline"
                >
                  hello@groomlocal.com
                </a>
                <br />
                Or visit our{" "}
                <Link
                  href="/contact"
                  className="text-brand-accent hover:underline"
                >
                  Contact page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
