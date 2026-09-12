import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy | NOXA",
  description:
    "How NOXA handles personal data across the NOXA website and NOXA: Car & Moto mobile applications.",
  alternates: { canonical: "https://noxastreetapp.com/privacy" },
};

const privacyEmail = "support@noxastreetapp.com";

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Privacy at NOXA"
      title="Privacy Policy"
      updated="12 September 2026"
      intro={
        <p>
          This policy explains how NOXA collects, uses, shares, retains and
          protects personal data across noxastreetapp.com, the NOXA: Car & Moto
          applications for iOS and Android, and the related NOXA backend
          services. It also explains your choices and how to request access,
          correction or deletion of your data.
        </p>
      }
      sections={[
        {
          id: "controller",
          title: "Who is responsible for your data",
          content: (
            <>
              <p>
                NOXA is an automotive and moto community platform operated by
                Sergkei Karaketidis in Greece. For the purposes of applicable
                data-protection law, including the General Data Protection
                Regulation where it applies, Sergkei Karaketidis is the data
                controller for the personal data described in this policy.
              </p>
              <p>
                Privacy, data-access and account-deletion requests can be sent
                to{" "}
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
          id: "scope-age",
          title: "Scope and age requirement",
          content: (
            <p>
              This policy applies to the NOXA website, NOXA: Car & Moto mobile
              applications, authentication and storage systems, maps, events,
              community features, notifications, support channels and other
              NOXA services that link to this policy. NOXA is not intended for
              children under 16, and we do not knowingly collect personal data
              from children under 16. If you believe a child has provided data,
              contact us so we can review and remove it where appropriate.
            </p>
          ),
        },
        {
          id: "data-collected",
          title: "Data we collect",
          content: (
            <>
              <p>Depending on the NOXA features you use, we may collect:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>
                  <strong>Account and authentication data:</strong> email
                  address, account identifier, authentication provider,
                  session information and security events. Authentication may
                  be provided through email/password, Apple or Google. NOXA
                  does not receive your Apple ID or Google password.
                </li>
                <li>
                  <strong>Profile data:</strong> display name, username,
                  avatar, biography, city and other profile details you choose
                  to add.
                </li>
                <li>
                  <strong>Garage and vehicle data:</strong> vehicle brand,
                  model, year, specifications, tuning details, description,
                  photos and visibility settings.
                </li>
                <li>
                  <strong>Content and social activity:</strong> posts, photos,
                  captions, comments, likes, saves, follows, crew memberships,
                  invitations, join requests, event attendance, messages and
                  other interactions you choose to create.
                </li>
                <li>
                  <strong>Crews, events and drives:</strong> crew roles,
                  event details, attendance responses, group-drive or convoy
                  participation, route points and content submitted as a host,
                  organiser or member.
                </li>
                <li>
                  <strong>Location data:</strong> precise device coordinates
                  when you grant location permission and use map positioning,
                  nearby features, route calculation, Live Drive or an active
                  Group Drive. During an explicitly enabled sharing session,
                  we may also process heading, speed, accuracy, timestamps,
                  visibility audience and session-expiry information.
                </li>
                <li>
                  <strong>Photos and media:</strong> images you deliberately
                  select from your device or otherwise choose to upload to
                  profiles, vehicles, crews, posts or events.
                </li>
                <li>
                  <strong>Notification data:</strong> notification
                  preferences, Expo push tokens, delivery status and identifiers
                  needed to route a notification to the correct NOXA screen.
                </li>
                <li>
                  <strong>Website and submission data:</strong> waitlist email,
                  optional city, selected language, event or community
                  submissions, organiser or community application details,
                  campaign/referrer information and consent records when those
                  features are used.
                </li>
                <li>
                  <strong>Technical and security data:</strong> IP address,
                  user-agent, device/app information, request timestamps,
                  network and security signals, and similar service logs that
                  may be processed by NOXA or its infrastructure providers.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "location",
          title: "Location and background location",
          content: (
            <>
              <p>
                Location access is permission-based. NOXA may use precise
                foreground location to place you on the map, show relevant
                nearby activity, or calculate a route when you request those
                features.
              </p>
              <p>
                Background location is used only while a Live Drive or Group
                Drive location-sharing session that you explicitly started is
                active. It can continue while the app is in the background or
                the screen is locked so the approved sharing feature continues
                to work. NOXA does not need continuous background location for
                ordinary browsing of events, profiles or the map.
              </p>
              <p>
                Live Drive sharing is optional and time-limited. You can stop
                sharing in NOXA, sign out, or revoke location permission in
                your device settings. The audience that can see active location
                depends on the visibility option you choose and the applicable
                NOXA access rules.
              </p>
            </>
          ),
        },
        {
          id: "purposes",
          title: "Why we use your data",
          content: (
            <>
              <p>We use personal data to:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>create, authenticate and secure NOXA accounts;</li>
                <li>
                  provide profiles, garages, posts, crews, events, maps,
                  group-drive features and the interactions you request;
                </li>
                <li>
                  operate optional location sharing and enforce the audience you
                  select;
                </li>
                <li>store and deliver photos and content you upload;</li>
                <li>
                  send service notifications, event reminders and other
                  communications you have enabled;
                </li>
                <li>
                  process waitlist, organiser, community and event submissions;
                </li>
                <li>
                  maintain, troubleshoot, protect and improve NOXA and prevent
                  spam, abuse, fraud and unauthorised access;
                </li>
                <li>respond to support, privacy, safety and legal requests.</li>
              </ul>
              <p>
                NOXA does not currently sell personal data, use third-party
                advertising SDKs, or use personal data for cross-app behavioural
                advertising. We do not make automated decisions that produce
                legal or similarly significant effects about users.
              </p>
            </>
          ),
        },
        {
          id: "legal-basis",
          title: "Legal bases in the EEA",
          content: (
            <>
              <p>Where EEA data-protection law applies, we rely on:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>
                  <strong>Contract:</strong> processing needed to create your
                  account and provide the NOXA features you request.
                </li>
                <li>
                  <strong>Consent:</strong> precise/background location, photo
                  access, optional marketing communications and other
                  permission-based features. You can withdraw consent at any
                  time through NOXA or your device settings where applicable.
                </li>
                <li>
                  <strong>Legitimate interests:</strong> service security,
                  abuse prevention, debugging, moderation, reliability and
                  understanding how the service performs, balanced against your
                  rights and expectations.
                </li>
                <li>
                  <strong>Legal obligation:</strong> processing or retention
                  required by applicable law or a valid legal request.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "sharing",
          title: "When information is shared",
          content: (
            <>
              <p>
                Some information is shared because NOXA is a social and
                event-discovery service. Profile, vehicle, crew, event, post and
                location information is shown to other users only according to
                the relevant visibility, membership and sharing settings. Public
                content may be visible broadly within NOXA or on NOXA public
                pages.
              </p>
              <p>We also use service providers, including:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#e32c49]">
                <li>
                  <strong>Supabase</strong> for authentication, database,
                  storage, realtime and serverless backend services;
                </li>
                <li>
                  <strong>Mapbox</strong> for native mobile map functionality
                  and map-related network requests;
                </li>
                <li>
                  <strong>OpenRouteService</strong> for route calculations;
                  route origin and destination coordinates are sent when a route
                  is requested;
                </li>
                <li>
                  <strong>Apple and Google</strong> when you choose their
                  sign-in services;
                </li>
                <li>
                  <strong>Expo</strong> for mobile build/platform services and
                  push-notification delivery; Expo push tokens and notification
                  payload data may be processed to deliver notifications;
                </li>
                <li>
                  <strong>Vercel</strong> for website hosting, performance
                  monitoring, Vercel Analytics and Speed Insights;
                </li>
                <li>
                  <strong>Resend</strong> where used for transactional or
                  operational email delivery.
                </li>
              </ul>
              <p>
                Providers receive only the information reasonably necessary for
                the service they provide. They may process data in countries
                outside Greece or the EEA. Where required, international
                transfers are protected by an adequacy decision, contractual
                safeguards or another lawful transfer mechanism.
              </p>
              <p>
                We may also disclose information when required by law, court
                order or a competent authority, or where reasonably necessary
                to protect users, investigate abuse or protect NOXA and others.
              </p>
            </>
          ),
        },
        {
          id: "analytics",
          title: "Website analytics, cookies and local storage",
          content: (
            <>
              <p>
                The NOXA website uses Vercel Analytics and Vercel Speed Insights
                to understand website usage and technical performance. These
                services may process technical request, page-view and
                performance information needed to provide those measurements.
              </p>
              <p>
                NOXA does not currently use third-party advertising cookies.
                Essential storage, security mechanisms and local preferences may
                be used where needed to operate the website, remember choices
                and protect the service.
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
                Account, profile and user-content data is generally retained
                while your NOXA account is active or for as long as needed to
                provide the service you requested. Data that you delete is
                removed from active product views, subject to normal technical
                backup cycles and lawful retention requirements.
              </p>
              <p>
                Active Live Drive location sharing is time-limited and is
                designed to expire after no more than four hours. Active
                location is also designed to be removed when sharing is stopped,
                you sign out, or account deletion completes.
              </p>
              <p>
                Waitlist information is retained until you withdraw consent,
                the relevant early-access purpose ends or the project no longer
                needs the record. Website application or submission data is
                retained for as long as reasonably needed to review the
                submission, operate the resulting relationship, resolve disputes
                or meet legal requirements.
              </p>
              <p>
                Limited security, fraud-prevention, legal or backup records may
                be retained after other data is deleted where there is a valid
                reason to do so. Protected backup copies are removed through
                normal backup-expiry cycles and are not used as active profile
                data.
              </p>
            </>
          ),
        },
        {
          id: "deletion",
          title: "Account and data deletion",
          content: (
            <>
              <p>
                You can start permanent account deletion from the NOXA mobile
                app under Settings → Privacy & Safety → Delete Account. The app
                requires an identity check before deletion is completed.
              </p>
              <p>
                If you no longer have access to the app, you can request account
                and associated-data deletion through our{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href="/delete-account"
                >
                  account deletion page
                </a>
                .
              </p>
              <p>
                A completed account deletion request is designed to remove the
                authentication account and associated personal data from active
                NOXA systems, including profile data, garage data, posts,
                comments, follows, crew/event ownership data and uploaded media,
                subject only to limited lawful security, fraud-prevention,
                dispute or legal retention described above.
              </p>
            </>
          ),
        },
        {
          id: "rights",
          title: "Your choices and rights",
          content: (
            <>
              <p>
                Depending on your location and the circumstances, you may have
                rights to access, correct, delete, restrict or receive a copy of
                your personal data, object to certain processing, and withdraw
                consent. Withdrawal does not affect processing that was lawful
                before the withdrawal.
              </p>
              <p>
                You can manage many choices directly in NOXA, including profile
                information, content, visibility, notifications and device
                permissions. Location and photo permissions can also be changed
                in your operating-system settings.
              </p>
              <p>
                Send privacy requests to{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href={`mailto:${privacyEmail}`}
                >
                  {privacyEmail}
                </a>
                . We may request limited information to verify that the request
                belongs to you.
              </p>
              <p>
                If GDPR applies, you also have the right to lodge a complaint
                with the Hellenic Data Protection Authority at{" "}
                <a
                  className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
                  href="https://www.dpa.gr/en"
                  rel="noreferrer"
                  target="_blank"
                >
                  dpa.gr
                </a>
                , or another competent supervisory authority.
              </p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security",
          content: (
            <p>
              We use technical and organisational measures designed to protect
              personal data, including encrypted network connections,
              authentication controls, restricted database access, row-level
              access rules, server-side validation, rate limits and provider
              security controls. No internet service can guarantee absolute
              security, so keep your credentials private and contact us if you
              suspect unauthorised access.
            </p>
          ),
        },
        {
          id: "changes-contact",
          title: "Changes and contact",
          content: (
            <>
              <p>
                We may update this policy as NOXA, its mobile applications,
                website, service providers or legal requirements change. The
                date at the top identifies the latest version. Material changes
                will be communicated through the app, website or another
                appropriate channel.
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
