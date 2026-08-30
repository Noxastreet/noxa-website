import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy | NOXA",
  description: "How NOXA handles personal data collected through the website and early-access waitlist.",
  alternates: { canonical: "https://noxastreetapp.com/privacy" },
};

const privacyEmail = "support@noxastreetapp.com";

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Privacy at NOXA"
      title="Privacy Policy"
      updated="30 August 2026"
      intro={
        <p>
          This policy explains how NOXA collects and uses personal data through
          noxastreetapp.com and its early-access waitlist. It applies to the
          launch website only. A separate policy may apply when the NOXA mobile
          application becomes publicly available.
        </p>
      }
      sections={[
        {
          id: "controller",
          title: "Who is responsible for your data",
          content: (
            <>
              <p>
                NOXA is an early-stage automotive social platform operated by
                S. Karaketidis in Greece. For the purposes of the General Data
                Protection Regulation, NOXA is the data controller for the
                personal data described in this policy.
              </p>
              <p>
                Privacy requests can be sent to{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href={`mailto:${privacyEmail}`}
                >
                  {privacyEmail}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "data-collected",
          title: "Data we collect",
          content: (
            <>
              <p>When you join the early-access waitlist, we collect:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>your email address;</li>
                <li>your city, when you choose to provide it;</li>
                <li>your consent and the date and time it was given;</li>
                <li>your selected language;</li>
                <li>campaign parameters, referrer information and the page source, when available.</li>
              </ul>
              <p>
                For security and abuse prevention, the website also temporarily
                processes technical information such as IP address, user-agent,
                request timing and form-submission signals. This information is
                used for rate limiting and fraud prevention and is not written
                into the NOXA waitlist table.
              </p>
            </>
          ),
        },
        {
          id: "purposes",
          title: "Why we use your data",
          content: (
            <>
              <p>We use waitlist data to:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>register and manage your early-access request;</li>
                <li>notify the NOXA team when a new early-access request is received;</li>
                <li>send relevant launch, testing and product updates;</li>
                <li>understand general geographic and campaign interest;</li>
                <li>prevent spam, automated submissions and misuse;</li>
                <li>maintain the security and reliability of the website.</li>
              </ul>
              <p>
                We do not sell your personal data and do not use the waitlist
                for third-party advertising profiles.
              </p>
            </>
          ),
        },
        {
          id: "legal-basis",
          title: "Legal basis",
          content: (
            <>
              <p>
                We process your email, optional city and early-access
                communications on the basis of your consent. You can withdraw
                that consent at any time.
              </p>
              <p>
                We process limited technical information where necessary for
                our legitimate interests in protecting the website, preventing
                abuse and maintaining reliable operation. We may also process
                information when required to comply with a legal obligation.
              </p>
            </>
          ),
        },
        {
          id: "processors",
          title: "Service providers and international processing",
          content: (
            <>
              <p>
                The website is hosted by Vercel, waitlist records are stored
                using Supabase, and transactional email delivery may be handled
                by Resend. These providers process only the information needed
                on our behalf to deliver hosting, database, security,
                infrastructure and email-notification services.
              </p>
              <p>
                When an early-access request is submitted, relevant waitlist
                details such as email address, optional city, selected language
                and campaign/referrer context may be included in a private NOXA
                team notification email. This does not change the purpose for
                which the information was submitted and is not used by NOXA for
                third-party advertising.
              </p>
              <p>
                Provider infrastructure may involve processing outside Greece
                or the European Economic Area. Where required, transfers are
                made using contractual or other safeguards recognised by
                applicable data-protection law.
              </p>
              <p>
                We may disclose information when required by law, court order or
                a competent public authority, or when necessary to protect users,
                the project or the security of the service.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep data",
          content: (
            <>
              <p>
                Waitlist data is kept until you withdraw your consent, the NOXA
                early-access purpose ends, or the project is discontinued. We
                will review and remove inactive waitlist records no later than
                24 months after the public launch of the relevant NOXA service,
                unless a longer period is required by law or needed to establish,
                exercise or defend legal claims.
              </p>
              <p>
                Short-lived rate-limit information is automatically discarded
                as server instances expire and is not retained as a permanent
                NOXA customer record.
              </p>
            </>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          content: (
            <>
              <p>
                Depending on the circumstances, you may request access,
                correction, deletion, restriction or portability of your data,
                object to certain processing, and withdraw consent at any time.
                Withdrawal does not affect processing that was lawful before the
                withdrawal.
              </p>
              <p>
                Send requests to{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href={`mailto:${privacyEmail}`}
                >
                  {privacyEmail}
                </a>
                . We may need to verify your identity before completing a
                request.
              </p>
              <p>
                You also have the right to lodge a complaint with the Hellenic
                Data Protection Authority at{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href="https://www.dpa.gr/en"
                  rel="noreferrer"
                  target="_blank"
                >
                  dpa.gr
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and analytics",
          content: (
            <p>
              NOXA does not currently use advertising cookies or a third-party
              behavioural analytics service on this launch website. Essential
              technical storage or security mechanisms may be used by the site
              or its infrastructure when required to deliver and protect the
              service. This policy will be updated before non-essential cookies
              or tracking technologies are introduced.
            </p>
          ),
        },
        {
          id: "security",
          title: "Security",
          content: (
            <p>
              We use reasonable technical and organisational safeguards,
              including encrypted HTTPS connections, restricted database rules,
              server-side validation, request limits and access controls. No
              internet service can guarantee absolute security, so users should
              avoid submitting information that is not requested by the form.
            </p>
          ),
        },
        {
          id: "children",
          title: "Children",
          content: (
            <p>
              The launch website is not intended to knowingly collect personal
              data from children who cannot validly provide consent under the
              law applicable to them. A parent or guardian who believes that a
              child has submitted data may contact us to request its deletion.
            </p>
          ),
        },
        {
          id: "changes-contact",
          title: "Changes and contact",
          content: (
            <>
              <p>
                We may update this policy when the website, mobile application
                or legal requirements change. The date at the top of this page
                identifies the latest version. Material changes will be
                communicated through the website or another appropriate channel.
              </p>
              <p>
                Questions about this policy can be sent to{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href={`mailto:${privacyEmail}`}
                >
                  {privacyEmail}
                </a>
                .
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
