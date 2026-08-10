import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Use | NOXA",
  description: "Terms governing use of the NOXA launch website and early-access waitlist.",
  alternates: { canonical: "https://noxastreetapp.com/terms" },
};

const contactEmail = "support@noxastreetapp.com";

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Website terms"
      title="Terms of Use"
      updated="31 July 2026"
      intro={
        <p>
          These terms govern your use of noxastreetapp.com and the NOXA
          early-access waitlist. They apply to the launch website only. The
          future NOXA mobile application may have additional terms before it is
          made available to users.
        </p>
      }
      sections={[
        {
          id: "operator",
          title: "About NOXA",
          content: (
            <>
              <p>
                NOXA is an early-stage automotive social-platform project
                operated by S. Karaketidis in Greece. The website introduces the
                product concept and allows drivers, communities and automotive
                businesses to express interest in early access.
              </p>
              <p>
                Contact concerning these terms may be sent to{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "acceptance",
          title: "Acceptance and eligibility",
          content: (
            <>
              <p>
                By accessing or using the website, you agree to these terms. If
                you do not agree, do not use the website or submit the waitlist
                form.
              </p>
              <p>
                You must have the legal capacity required under the law
                applicable to you. Anyone using the website on behalf of an
                organisation confirms that they are authorised to act for that
                organisation.
              </p>
            </>
          ),
        },
        {
          id: "waitlist",
          title: "Early-access waitlist",
          content: (
            <>
              <p>
                Joining the waitlist records your interest only. It does not
                create an account, guarantee admission to testing, reserve a
                place, establish a commercial relationship or guarantee that the
                mobile application will launch on a particular date or with a
                particular feature set.
              </p>
              <p>
                You must submit accurate information that belongs to you. You
                may withdraw from early-access communications at any time using
                the contact details in the Privacy Policy or instructions in a
                future message.
              </p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          content: (
            <>
              <p>You must not:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>submit another person&apos;s data without authorisation;</li>
                <li>use bots, scripts or automated tools to abuse the form;</li>
                <li>attempt to bypass security, rate limits or access controls;</li>
                <li>interfere with the website, hosting or connected services;</li>
                <li>introduce malware, harmful code or deceptive content;</li>
                <li>use the website in violation of applicable law or third-party rights.</li>
              </ul>
              <p>
                We may restrict access, reject submissions or take protective
                measures when we reasonably believe the website is being abused.
              </p>
            </>
          ),
        },
        {
          id: "product-information",
          title: "Product information and changes",
          content: (
            <>
              <p>
                Screens, maps, routes, business profiles, driver counts, event
                details and other product demonstrations on the website are
                illustrative. They may use prototype data and may not represent
                the final mobile application.
              </p>
              <p>
                NOXA may change, postpone or discontinue website content,
                planned features, launch dates, eligibility criteria or the
                early-access programme without creating liability to waitlist
                participants.
              </p>
            </>
          ),
        },
        {
          id: "intellectual-property",
          title: "Intellectual property",
          content: (
            <>
              <p>
                The NOXA name, visual identity, website design, text, graphics,
                product concepts, software and other original material are owned
                by NOXA or used with permission and are protected by applicable
                intellectual-property laws.
              </p>
              <p>
                You may view the website for personal, informational purposes.
                You may not reproduce, publish, sell, reverse engineer or create
                derivative commercial material from the website without prior
                written permission, except where applicable law expressly allows
                it.
              </p>
            </>
          ),
        },
        {
          id: "third-parties",
          title: "Third-party services and links",
          content: (
            <p>
              The website depends on third-party infrastructure such as Vercel
              and Supabase and may contain links to external websites. NOXA does
              not control third-party services and is not responsible for their
              content, availability, security or independent terms and privacy
              practices. Use of those services may be governed by separate
              agreements.
            </p>
          ),
        },
        {
          id: "availability",
          title: "Availability and disclaimers",
          content: (
            <>
              <p>
                The website is provided on an “as available” basis. We aim to
                keep it accurate and secure, but do not guarantee uninterrupted
                availability, error-free operation, permanent data retention or
                that all content is complete and current.
              </p>
              <p>
                Nothing on the website is driving, navigation, safety, legal,
                financial or professional advice. Users remain responsible for
                lawful and safe conduct on public roads and at automotive events.
              </p>
            </>
          ),
        },
        {
          id: "liability",
          title: "Limitation of liability",
          content: (
            <p>
              To the maximum extent permitted by applicable law, NOXA will not
              be liable for indirect, incidental or consequential loss arising
              from use of, inability to use, or reliance on the launch website or
              waitlist. Nothing in these terms excludes liability that cannot be
              excluded or limited by law, including mandatory consumer rights.
            </p>
          ),
        },
        {
          id: "privacy",
          title: "Privacy",
          content: (
            <p>
              Personal data submitted through the website is handled according
              to the{" "}
              <Link
                className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                href="/privacy"
              >
                NOXA Privacy Policy
              </Link>
              , which forms part of the website information provided to you.
            </p>
          ),
        },
        {
          id: "law",
          title: "Governing law and disputes",
          content: (
            <>
              <p>
                These terms are governed by the laws of Greece, without
                depriving consumers of mandatory protections available under the
                law of their country of residence.
              </p>
              <p>
                Before starting formal proceedings, users are encouraged to
                contact NOXA so that a concern can be reviewed and resolved
                directly where possible. Courts with jurisdiction under
                applicable law will remain available.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          content: (
            <p>
              We may update these terms as the project, website or legal
              requirements change. The latest version will be published here
              with a revised date. Continued use of the website after an update
              means the revised terms apply from the date they take effect.
            </p>
          ),
        },
      ]}
    />
  );
}
