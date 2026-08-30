# NOXA waitlist email delivery

The production waitlist endpoint uses Resend for two transactional messages after a successful Supabase insert:

1. Founder notification → `noxastreetapp@gmail.com`
2. Applicant confirmation → the email address submitted in the form

## Required Vercel environment variables

### `RESEND_API_KEY`

Secret Resend API key. Never expose this as `NEXT_PUBLIC_*` and never commit it to Git.

### `WAITLIST_FROM_EMAIL`

Verified sender identity on the NOXA domain, for example:

```text
NOXA <earlyaccess@noxastreetapp.com>
```

Applicant confirmation emails are intentionally disabled unless this variable is set to a non-`@resend.dev` sender. This prevents accidental attempts to send production confirmations from Resend's onboarding sender before domain verification is complete.

## Domain verification

Add `noxastreetapp.com` in Resend → Domains and publish every DNS record Resend provides (normally DKIM plus SPF/sending records). Use the exact record names and values shown by Resend; do not guess or reuse records from another domain.

After Resend reports the domain as verified:

1. Set `WAITLIST_FROM_EMAIL=NOXA <earlyaccess@noxastreetapp.com>` in Vercel for Production and Preview.
2. Redeploy the project so the serverless function receives the new environment value.
3. Submit a fresh waitlist email address.
4. Verify the API returns `201` and runtime logs contain no Resend error.
5. Verify both messages are delivered: the founder lead notification and the localized applicant confirmation.

## Failure behavior

- The Supabase insert is the source of truth.
- Email failures do not discard a successfully saved waitlist entry.
- Founder and applicant emails are sent independently.
- Applicant confirmation is localized according to the submitted site locale (`en` or `el`).
