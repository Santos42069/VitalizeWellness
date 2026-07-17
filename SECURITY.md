# Security Notes

## Contact Form Secrets

The contact form now sends submissions to `/.netlify/functions/contact`. Do not place EmailJS keys in HTML or browser JavaScript.

Set these environment variables in Netlify or the production hosting provider:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `CONTACT_TO_EMAIL`

Because the previous implementation documented browser-side EmailJS keys, rotate any EmailJS keys that were ever pasted into the site source, browser console, screenshots, or shared files. After rotation, only store the new values as server-side environment variables.

## Rate Limits

The contact endpoint applies a 15-minute window with these defaults:

- IP address: 10 submissions per window
- Email/user: 3 submissions per window

429 responses are JSON and include `retryAfterSeconds` plus a `Retry-After` header.

## Validation

The server rejects unexpected fields, wrong types, invalid select options, oversized input, invalid dates, and missing consent. Client validation exists only to improve the user experience; server validation is authoritative.
