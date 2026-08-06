# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 2025.12.29 (latest) | ✅ |
| Earlier versions | ❌ |

## Reporting a Vulnerability

DartStreamLine operates with a **local-first, client-side-only** architecture. No user code is transmitted to any server — all file parsing and merging is done entirely in the browser.

However, if you discover a security vulnerability (e.g. a malicious `.dart` file that causes unexpected browser behaviour, a dependency with a known CVE, or a cross-site scripting risk in the output renderer), please report it responsibly:

1. **Do NOT open a public GitHub Issue** for security vulnerabilities.
2. Email the maintainer directly at: **[your-email@example.com]** with the subject line `[SECURITY] DartStreamLine vulnerability report`.
3. Include:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Any suggested mitigations

You can expect an acknowledgement within **48 hours** and a resolution timeline within **7 days** for confirmed vulnerabilities.

We appreciate responsible disclosure and will credit reporters in the fix release notes.
