# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest `main` | ✅ |
| Older branches | ❌ |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do not open a public GitHub Issue.**

Report it privately by emailing: **care@vitalizewellness.health**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested remediation (optional)

We aim to respond within **48 hours** and will work to patch confirmed vulnerabilities promptly.

---

## Security Architecture Summary

This site uses a layered client-side defence-in-depth stack. See the main [README](../README.md#security-architecture) for the full breakdown.

### Key Files

| File | Purpose |
|---|---|
| `security.js` | Rate limiter, validator, sanitizer, honeypot |
| `contact.js` | Form submission — uses `VWSecurity` throughout |
| `config.js` | Centralised config — no secrets at runtime |
| `netlify.toml` | HTTP response headers including strict CSP |
| `contact.html` | CSP meta-tag fallback + honeypot field |

### What to Never Do

- **Never** add SMTP passwords, private API keys, or database credentials to any file in this repo
- **Never** use `innerHTML` with user-supplied data — use `textContent` or DOM methods
- **Never** disable the Content Security Policy headers in `netlify.toml`
- **Never** remove the honeypot field from `contact.html`
- **Never** skip the `Validator.validate()` call before sending an email


## OWASP References

This project was developed with reference to the following OWASP cheat sheets:

- [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
