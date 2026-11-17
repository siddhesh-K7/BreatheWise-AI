# Security Policy (SECURITY.md)

AirWise implements defense-in-depth principles across its frontend, API handlers, and AI pipelines to safeguard user privacy and infrastructure integrity.

---

## Supported Versions

| Version | Supported | Release Date |
|---|---|---|
| 1.0.x | Yes | November 2026 |

---

## Security Architecture & Defenses

### 1. Server-Side AI Execution & Secret Isolation
- All Google Gemini AI API queries execute strictly in serverless Node.js Route Handlers (`src/app/api/chat/route.ts`, `src/app/api/recommendations/route.ts`).
- `GEMINI_API_KEY` is never bundled into client scripts, DOM attributes, or public JavaScript chunks.
- Git histories and commit objects are verified via automated secret scanning before release.

### 2. User Privacy & Zero PII Persistence
- AirWise requires **no user authentication, accounts, or database persistence**.
- Health vulnerability toggles (children, elderly, respiratory sensitivity) reside exclusively in browser client state and are discarded upon tab closure.
- **Coordinate Privacy**: Geolocation fixes are rounded to 2 decimal places (~1.1 km spatial resolution) prior to querying Open-Meteo or Gemini, preventing precise user tracking.

### 3. Prompt Injection Defense
- User chat messages and profile details are sanitized via `src/validators/schemas.ts`:
  * All HTML/XML opening and closing tags are stripped.
  * System override injection cues (`ignore previous instructions`, `override prompt`) are neutralized.
  * User inputs are passed into delimited `<user_query>` XML blocks with strict system instructions instructing Gemini to refuse jailbreak attempts.

### 4. HTTP Security Headers
The following headers are enforced in `next.config.mjs`:
- `Content-Security-Policy`: Restricts scripts, styles, fonts, and connects strictly to verified endpoints (`self`, `air-quality-api.open-meteo.com`, `generativelanguage.googleapis.com`).
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: `geolocation=(self), camera=(), microphone=(), payment=()`

### 5. Input Validation & Abuse Prevention
- Every inbound parameter is parsed and bounded via Zod schemas.
- Spatial coordinates are capped to valid geographic intervals: Latitude $[-90, 90]$, Longitude $[-180, 180]$.
- IP rate limiting thwarts denial-of-service attempts and upstream quota exhaustion.

---

## Reporting a Vulnerability

Please report security issues or vulnerabilities responsibly via GitHub Private Security Advisories on [SabarishR08/airwise-urban-air-quality-assistant](https://github.com/SabarishR08/airwise-urban-air-quality-assistant/security/advisories).
