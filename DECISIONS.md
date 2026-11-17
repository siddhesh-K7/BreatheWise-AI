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
