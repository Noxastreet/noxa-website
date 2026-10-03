import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Support | NOXA",
  description:
    "Official support information for NOXA: Car & Moto on iOS and Android.",
  alternates: { canonical: "https://noxastreetapp.com/support" },
};

const supportEmail = "support@noxastreetapp.com";

export default function SupportPage() {
  return (
    <LegalDocument
      eyebrow="NOXA support"
      title="Support"
      updated="3 October 2026"
      intro={
        <p>
          Need help with <strong>NOXA: Car & Moto</strong>? Contact the NOXA
          support team or use the resources below for account, privacy and
          deletion questions.
        </p>
      }
      sections={[
        {
          id: "contact",
          title: "Contact support",
          content: (
            <>
              <p>
                Email{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href={`mailto:${supportEmail}`}
                >
                  {supportEmail}
                </a>
                .
              </p>
              <p>
                When contacting support, include your NOXA username and a short
                description of the issue. Never send passwords, one-time codes,
                Apple credentials or Google credentials.
              </p>
            </>
          ),
        },
        {
          id: "account",
          title: "Account and sign-in help",
          content: (
            <p>
              If you cannot sign in, describe which sign-in method you use
              (email/password, Apple or Google), the device platform, and the
              error shown in the app. Support may ask for limited account
              details needed to locate the account.
            </p>
          ),
        },
        {
          id: "privacy",
          title: "Privacy and account deletion",
          content: (
            <p>
              Read the{" "}
              <a
                className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                href="https://noxastreetapp.com/privacy"
              >
                Privacy Policy
              </a>{" "}
              or follow the{" "}
              <a
                className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                href="https://noxastreetapp.com/delete-account"
              >
                account deletion instructions
              </a>
              .
            </p>
          ),
        },
        {
          id: "safety",
          title: "Safety",
          content: (
            <p>
              NOXA is not an emergency service. For immediate danger, accidents,
              medical emergencies or crimes in progress, contact the appropriate
              local emergency service first.
            </p>
          ),
        },
      ]}
    />
  );
}
