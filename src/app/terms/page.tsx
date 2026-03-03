import { Metadata } from "next";
import Link from "next/link";
import { WaveDivider } from "@/components/wave-divider";

export const metadata: Metadata = {
  title: "Terms of Service | GroomLocal Directory",
  description:
    "Review the terms and conditions for using the GroomLocal pet grooming directory.",
};

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-text-muted">
              The rules of the road for using GroomLocal.
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
                1. Acceptance of Terms
              </h2>
              <p className="text-text-muted leading-relaxed">
                By accessing or using GroomLocal (&ldquo;the Site&rdquo;), you
                agree to be bound by these Terms of Service. If you do not agree
                with any part of these terms, you may not use the Site. We
                reserve the right to update these terms at any time, and your
                continued use constitutes acceptance of any changes.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                2. Description of Service
              </h2>
              <p className="text-text-muted leading-relaxed">
                GroomLocal is a pet grooming directory serving the Pacific
                Northwest. We provide a platform for pet parents to discover and
                compare grooming businesses, and for grooming businesses to
                manage their public profiles. GroomLocal does not directly provide
                grooming services and is not a party to any transaction between
                pet parents and groomers.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                3. User Accounts
              </h2>
              <p className="text-text-muted leading-relaxed mb-3">
                To claim and manage a business listing, you must create an
                account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-text-muted">
                <li>
                  Provide accurate and complete information during registration.
                </li>
                <li>
                  Keep your login credentials secure and confidential.
                </li>
                <li>
                  Accept responsibility for all activity under your account.
                </li>
                <li>
                  Notify us immediately of any unauthorized use.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                4. Business Listing Claims
              </h2>
              <p className="text-text-muted leading-relaxed mb-3">
                By claiming a business listing, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-text-muted">
                <li>
                  You are an authorized representative of the business.
                </li>
                <li>
                  The information you provide is accurate and up to date.
                </li>
                <li>
                  You will not use the listing for misleading or fraudulent
                  purposes.
                </li>
              </ul>
              <p className="text-text-muted leading-relaxed mt-3">
                GroomLocal reserves the right to verify ownership claims and
                remove or suspend listings that violate these terms.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                5. Acceptable Use
              </h2>
              <p className="text-text-muted leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-text-muted">
                <li>
                  Use the Site for any unlawful or prohibited purpose.
                </li>
                <li>
                  Submit false, misleading, or defamatory content.
                </li>
                <li>
                  Scrape, crawl, or harvest data from the Site without written
                  permission.
                </li>
                <li>
                  Interfere with or disrupt the Site&apos;s operation or
                  security.
                </li>
                <li>
                  Impersonate another person or business.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                6. Content &amp; Intellectual Property
              </h2>
              <p className="text-text-muted leading-relaxed mb-3">
                All original content on GroomLocal &mdash; including text, design,
                graphics, logos, and the Maui mascot &mdash; is owned by
                GroomLocal and protected by applicable intellectual property laws.
              </p>
              <p className="text-text-muted leading-relaxed">
                Business owners retain ownership of content they submit
                (photos, descriptions, etc.) but grant GroomLocal a non-exclusive,
                royalty-free license to display that content on the Site for the
                purpose of operating the directory.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                7. Paid Plans &amp; Subscriptions
              </h2>
              <p className="text-text-muted leading-relaxed">
                GroomLocal may offer paid subscription tiers for enhanced business
                listings. If you purchase a paid plan, you agree to the pricing
                and billing terms presented at the time of purchase. All fees
                are non-refundable unless otherwise stated. We reserve the right
                to change pricing with reasonable notice.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-text-muted leading-relaxed">
                GroomLocal is provided &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; without warranties of any kind, express or
                implied. We do not guarantee the accuracy, completeness, or
                reliability of any listing information. We are not responsible
                for the quality of services provided by any grooming business
                listed on the Site. Pet parents use the directory at their own
                discretion and risk.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-text-muted leading-relaxed">
                To the fullest extent permitted by law, GroomLocal and its
                operators shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising from your
                use of the Site, any interactions with businesses found through
                the Site, or any errors or omissions in listing information.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                10. Termination
              </h2>
              <p className="text-text-muted leading-relaxed">
                We may suspend or terminate your account and access to the Site
                at our sole discretion, with or without notice, for conduct that
                we believe violates these terms or is harmful to other users, us,
                or third parties. Upon termination, your right to use the Site
                ceases immediately.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                11. Governing Law
              </h2>
              <p className="text-text-muted leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Washington, without regard to its
                conflict of law provisions.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-4">
                12. Contact
              </h2>
              <p className="text-text-muted leading-relaxed">
                Questions about these Terms? Reach out:
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
