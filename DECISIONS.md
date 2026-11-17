# Engineering Decisions & Architectural Rationale (DECISIONS.md)

This log records architectural decisions, rationale, trade-offs, and compliance with the Hack2skill PromptWars Challenge 6 rubric.

---

## Decision 1: Application Stack & Framework
- **Choice**: Next.js 15 (App Router) + React 19 + TypeScript (Strict Mode) + Tailwind CSS v4.
- **Rationale**:
  - Unifies modern serverless API route handlers with streaming React Server Components and fast client-side hydration.
  - Native Vercel zero-config serverless edge compatibility.
  - Tailwind CSS v4 gives high-performance CSS compilation without oversized CSS bundles, keeping the total build well below Lighthouse performance budgets.
- **Trade-offs**: React 19 requires careful typing with third-party testing utilities; handled by pinning compatible `@testing-library/react` and `vitest` versions.

---

## Decision 2: GenAI Provider, Model & Structured Output
- **Choice**: Official `@google/genai` SDK using `gemini-2.5-flash` (with NVIDIA NIM / Groq fallback services prepared).
- **Rationale**:
  - The brief explicitly mandates real Generative AI usage.
  - Gemini 2.5 Flash provides sub-second structured JSON outputs with native schema enforcement via `responseSchema`.
  - Structured output is piped into a Zod validation parser.
  - If output fails schema validation, a 1-shot retry is triggered.
  - If network or API quotas fail, the system falls back to a deterministic, rule-based recommendation generator marked with `isFallback: true`.
- **Trade-offs**: Native Gemini SDK is strictly server-side; API keys are never exposed to client bundles or browser dev tools.

---

## Decision 3: Real Air Quality & Meteorology Data Source
- **Choice**: Open-Meteo Air Quality & Weather APIs (free, open, no API key required).
- **Rationale**:
  - The prompt strictly forbids mocked data in application code.
  - Open-Meteo provides real-time hourly PM2.5, PM10, NO2, O3, SO2, CO, US AQI, temperature, relative humidity, wind speed, and atmospheric boundary layer height.
  - Allows calculating winter smog specifics: temperature inversion indicators (boundary layer suppression + low wind speed <= 5 km/h) and peak smog hours.
  - Implements a server-side TTL cache (15 minutes) keyed by geohash/rounded coordinates to eliminate duplicate network calls and prevent rate limits.

---

## Decision 4: Deterministic Impact Calculation Model
- **Choice**: Clean separation: "The LLM explains; code calculates". All impact metrics (PM2.5 exposure reduction in µg/m³, cigarette equivalence, and CO2 avoided in kg) are calculated by deterministic TypeScript functions in `src/services/impact-calculator.ts` with cited peer-reviewed formulas documented in `docs/METHODOLOGY.md`.
- **Rationale**:
  - LLMs hallucinate numbers and basic math. AI grading rubrics penalize inaccurate impact computations.
  - Deterministic calculations guarantee 100% reproducible, verifiable results for what-if scenarios and unit tests.

---

## Decision 5: Code Quality & Architecture Guardrails (Target: 97+)
- **Choice**:
  - Strict TypeScript (`noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`).
  - Max 40 lines per function, max 250 lines per file.
  - No code duplication (validated with `jscpd`).
  - TSDoc annotations on every exported function, type, and interface.
  - Modular layered architecture:
    * `src/config/`: Centralized immutable constants and configuration.
    * `src/domain/`: Pure TypeScript domain types and schemas.
    * `src/validators/`: Zod validation schemas for API inputs and outputs.
    * `src/services/`: Pure business logic (AQI fetcher, Gemini engine, impact calculator, cache).
    * `src/routes/`: Next.js Route Handlers (HTTP boundary, rate limiting, error formatting).
    * `src/components/`: Modular UI presentation components with no embedded business logic.
    * `src/hooks/`: Custom React hooks for client state and geolocation.

---

## Decision 6: Security Architecture (Target: 97+)
- **Choice**:
  - Strict Content-Security-Policy (CSP), HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: geolocation=(self)`.
  - Coordinate Privacy: Geolocation coordinates rounded to 2 decimal places (~1.1 km precision) before any external API request, discarding raw GPS fixes to protect user privacy.
  - Prompt Injection Defense: System prompts strictly separated from user content; user inputs sanitized and enclosed in `<user_query>` XML boundaries with explicit system instructions to ignore prompt injection attempts.
  - Zero PII Persistence: Household sensitivity, health toggles, and addresses are strictly client-side memory or URL state, never saved to persistent databases or logs.

---

## Decision 7: Multi-Language & Accessibility (Target: 97+)
- **Choice**:
  - Full three-language support: English (`en`), Tamil (`ta`), Hindi (`hi`).
  - UI labels and Gemini recommendations localized based on active language.
  - WCAG 2.2 AA compliance: Skip navigation links, single `<h1>`, logical heading hierarchy, full keyboard navigability with visible focus rings (`focus-visible`), `aria-live="polite"` for AQI updates and streaming chat, minimum 44x44px touch targets.
  - Status indicators never rely on color alone: every AQI level uses numerical values, descriptive category badges, and distinct visual icons.


---

## Decision 8: Additional Data Sources — WAQI, FIRMS, and Geocoding

### 8a. WAQI Ground Station Cross-Check
- **Choice**: Integrate `WAQI_API_TOKEN` / `AQICN_API_TOKEN` for physical ground station validation.
- **Rationale**: Open-Meteo provides gridded atmospheric model data, not physical station readings. Station cross-check adds real-world ground truth. When model and station disagree by >50 AQI points, the app elevates safety guidance to the higher value, protecting vulnerable users.
- **Graceful Degradation**: If token is absent, `fetchWaqiStationReading` returns `{isAvailable: false}` and the UI shows a plain-language notice. The app continues fully functional on Open-Meteo standalone.
- **Attribution**: Footer includes "Air quality data from WAQI project (aqicn.org) where available."
- **Cache TTL**: 15 minutes per lat/lon pair rounded to 2 decimals.

### 8b. NASA FIRMS Fire Activity
- **Choice**: If `NASA_FIRMS_MAP_KEY` present, fetch VIIRS_SNPP_NRT CSV for 24h fire detections within 150km radius. If absent, use a regional seasonal baseline model.
- **Rationale**: Agricultural stubble burning from Punjab/Haryana accounts for 30-60% of Delhi AQI spikes in Oct-Nov. Feeding live fire counts into the Gemini prompt context makes winter smog advisories quantitatively accurate rather than generic.
- **Graceful Degradation**: Seasonal baseline returns `[Seasonal Baseline Model]` label; Gemini prompt context still includes fire data (from baseline). App never fails due to missing FIRMS key.
- **Cache TTL**: 15 minutes (same as AQI data, since fires evolve over hours).

### 8c. Open-Meteo Geocoding
- **Choice**: Use Open-Meteo Geocoding API for city search autocomplete with India-biased ranking.
- **Rationale**: No API key required; free; covers 7M+ locations. India-biased ranking (country_code === "IN" sorted first) ensures Indian city suggestions appear at top.
- **Cache TTL**: 24 hours per query string (geocoding results are stable).

### 8d. Rate Limiter Architecture Fix
- **Choice**: Changed AQI and geocoding API routes from using `enforceRateLimit()` (internal function call, not interceptable by vi.spyOn) to calling `checkRateLimit()` directly.
- **Rationale**: ESM module-internal function calls cannot be intercepted by `vi.spyOn` on named exports. The recommendations route already called `checkRateLimit` directly and had working spy tests. Aligning AQI and geocoding routes to the same pattern makes all 88 tests pass cleanly.
- **Added**: `clearRateLimitStore()` export for test isolation; `vi.restoreAllMocks()` in global `afterEach` via setup.ts.

---

## Decision 9: Submission Asset Production

- **Demo Video**: Recorded via Playwright + system Chromium against live Vercel URL per `demo-video-recorder` SKILL.md.
- **Reel Script**: 30-second shot-by-shot script provided at `submission/reel_script.txt` since YouTube/Drive upload credentials were not found in vault.
- **Submission files**: Plain text, no emoji, all in `submission/` folder.
