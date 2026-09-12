import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Delete your NOXA account | NOXA",
  description:
    "How to permanently delete a NOXA: Car & Moto account and associated personal data.",
  alternates: { canonical: "https://noxastreetapp.com/delete-account" },
};

const supportEmail = "support@noxastreetapp.com";
const deletionMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
  "Delete my NOXA account",
)}`;

export default function DeleteAccountPage() {
  return (
    <LegalDocument
      eyebrow="NOXA account controls"
      title="Delete your NOXA account"
      updated="12 September 2026"
      intro={
        <p>
          This page explains how users of <strong>NOXA: Car & Moto</strong> can
          permanently delete their account and associated personal data. You do
          not need to reinstall the app to request deletion.
        </p>
      }
      sections={[
        {
          id: "in-app",
          title: "Delete your account in the app",
          content: (
            <>
              <p>
                If you can access the NOXA mobile app, use the built-in deletion
                flow:
              </p>
              <ol className="list-decimal space-y-2 pl-5 marker:text-[#e32c49]">
                <li>Open NOXA: Car & Moto.</li>
                <li>Open Settings.</li>
                <li>Open Privacy &amp; Safety.</li>
                <li>Select Delete Account.</li>
                <li>Complete the identity verification shown in the app.</li>
                <li>Confirm permanent deletion.</li>
              </ol>
              <p>
                The identity check is used to reduce the risk of someone else
                deleting your account without permission.
              </p>
            </>
          ),
        },
        {
          id: "without-app",
          title: "Request deletion without the app",
          content: (
            <>
              <p>
                If you cannot access the app, email{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href={deletionMailto}
                >
                  {supportEmail}
                </a>{" "}
                from the email address connected to your NOXA account whenever
                possible. Use the subject <strong>Delete my NOXA account</strong>.
              </p>
              <p>
                Include the account email address and your NOXA username if you
                know it. We may ask for limited additional information needed
                to verify that the request belongs to you. Never send us your
                password, Apple password, Google password, one-time login code,
                or other authentication secret.
              </p>
            </>
          ),
        },
        {
          id: "deleted-data",
          title: "What is deleted",
          content: (
            <>
              <p>
                After a valid account-deletion request is completed, NOXA is
                designed to remove the authentication account and associated
                personal data from active systems. Depending on what you used,
                this can include:
              </p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>profile and account data;</li>
                <li>garage and vehicle records;</li>
                <li>posts, comments, follows and other account-linked activity;</li>
                <li>crew and event data owned by the account;</li>
                <li>uploaded profile, vehicle, crew, post and event media;</li>
                <li>active Live Drive or Group Drive location-sharing data;</li>
                <li>registered push-notification device records.</li>
              </ul>
              <p>
                Some information may already have been shared with other users
                or included in content created by others. Their independent
                copies or lawful records are outside the scope of deleting your
                NOXA account.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "Limited retention after deletion",
          content: (
            <p>
              Limited information may be retained where reasonably necessary
              for security, fraud prevention, dispute resolution, enforcement
              of legal rights, compliance with law, or protected backup cycles.
              Such retained information is not kept as an active NOXA profile
              and is removed when the applicable retention purpose or backup
              period ends.
            </p>
          ),
        },
        {
          id: "privacy",
          title: "Privacy questions",
          content: (
            <p>
              For more detail about how NOXA handles personal data, location,
              photos, notifications, service providers, retention and your
              rights, read the{" "}
              <a
                className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                href="/privacy"
              >
                NOXA Privacy Policy
              </a>
              . Privacy and deletion questions can also be sent to{" "}
              <a
                className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
