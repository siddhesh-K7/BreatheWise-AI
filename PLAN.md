# AirWise — Implementation Milestones & Task Plan (PLAN.md)

This execution plan maps out the end-to-end development, testing, deployment, and submission workflow for **AirWise — Urban Air Quality Assistant** (Hack2skill PromptWars Challenge 6).

---

## Milestone 0: Foundation & Analysis (Complete)
- [x] Locate and analyze Challenge 5 codebase (`celebration-event-planner`).
- [x] Identify root causes of C5 scores (Code Quality 86 -> Target 97+).
- [x] Produce comprehensive `ANALYSIS_C5.md`.
- [x] Inspect credentials vault securely without printing or committing secrets.
- [x] Initialize clean Git repository at `E:\wkspc\airwise-urban-air-quality-assistant`.
- [x] Document architectural decisions in `DECISIONS.md`.

---

## Milestone 1: Domain Modeling, Validators & Methodology
- [ ] Create `docs/METHODOLOGY.md` detailing mathematical formulas and peer-reviewed sources for:
  * PM2.5 exposure reduction (HEPA filtration, N95 masking, peak hour avoidance).
  * Cigarette equivalence (Berkeley Earth standard: 22 µg/m³ PM2.5 per day = 1 cigarette).
  * Carbon emission reduction (clean transit vs solo vehicle, sustainable cooking).
- [ ] Create `src/config/constants.ts` with typed configurations, AQI thresholds, token ceilings, and cache TTLs.
- [ ] Create `src/domain/types.ts` with strict TypeScript types and interfaces (no `any`).
- [ ] Create `src/validators/schemas.ts` with Zod schemas for user profile, location query, coordinates, plan requests, and chat.
- [ ] Create `src/config/translations.ts` with dictionary translations for English, Tamil, and Hindi.

---

## Milestone 2: Core Engineering Services
- [ ] Implement `src/services/cache.ts`: High-throughput in-memory TTL cache with geohash rounding for zero-redundancy calls.
- [ ] Implement `src/services/aqi-service.ts`: Real-time Open-Meteo Air Quality & Weather client (PM2.5, PM10, NO2, O3, SO2, CO, US AQI, temperature inversion indicators, wind speed).
- [ ] Implement `src/services/impact-calculator.ts`: Deterministic, table-driven mathematical impact engine.
- [ ] Implement `src/services/gemini-service.ts`: Native Google Gen AI SDK client with structured schema, 1-shot retry, and deterministic fallback generator.
- [ ] Implement `src/services/rate-limiter.ts`: In-memory IP rate limiter with custom windowing and headers.

---

## Milestone 3: Serverless API Routes
- [ ] Implement `/api/health`: Health status endpoint returning uptime, cache status, and version.
- [ ] Implement `/api/aqi`: Location search and coordinate-based AQI fetching with TTL caching.
- [ ] Implement `/api/recommendations`: Structured plan generator with schema validation and fallback.
- [ ] Implement `/api/chat`: Grounded, injection-resistant streaming chat using Server-Sent Events (SSE).
- [ ] Configure `next.config.js` with comprehensive CSP, HSTS, Permissions-Policy, and cache headers.

---

## Milestone 4: Client Application & Accessible UI
- [ ] Build core UI library components (SkipLink, Navbar, LanguageSwitch, AlertBanner, MetricCard, Button).
- [ ] Build `AqiOverview`: Visual AQI gauge with accessible text/icon indicators, winter smog alerts, and inversion warnings.
- [ ] Build `ProfileForm`: Accessible household profile builder with sensitivity toggles and commute selectors.
- [ ] Build `PlanDisplay`: Categorized routines, indoor hacks (ranked by cost), and sustainable alternatives.
- [ ] Build `WhatIfSimulator`: Client-side real-time exposure and cigarette equivalence recalculator.
- [ ] Build `StreamingChat`: Accessible chat interface with `aria-live` streaming updates.
- [ ] Build `CommunityView`: Shareable neighborhood AQI summary card (no user accounts needed).
- [ ] Build Demo Presets: One-click selector for Delhi, Chennai, Lucknow, and Kolkata.

---

## Milestone 5: Rigorous Testing Suite
- [ ] Setup Vitest, `@testing-library/react`, `vitest-axe`, and Supertest.
- [ ] Write unit tests for `impact-calculator.ts` with boundary cases and mathematical assertions.
- [ ] Write unit tests for `aqi-service.ts` and `gemini-service.ts` with mocked network boundaries.
- [ ] Write unit tests for Zod validators and prompt injection defense.
- [ ] Write component accessibility tests with `axe` on all interactive screens.
- [ ] Write integration tests for API routes (`/api/aqi`, `/api/recommendations`, `/api/chat`, `/api/health`).
- [ ] Write Playwright E2E test flows (Preset selection, Plan generation, What-if simulation).
- [ ] Enforce >=90% line coverage and >=85% branch coverage.

---

## Milestone 6: GitHub Setup & DevOps
- [ ] Create public GitHub repo `airwise-urban-air-quality-assistant` via `gh` CLI.
- [ ] Add topics and descriptive metadata.
- [ ] Configure GitHub Actions workflow `.github/workflows/ci.yml` (lint, typecheck, test with coverage, build, audit).
- [ ] Configure `dependabot.yml`, `SECURITY.md`, `LICENSE` (MIT), `CONTRIBUTING.md`.
- [ ] Generate `docs/METRICS.md` with measured numbers from live test runs.
- [ ] Write comprehensive `README.md` containing all required sections, Mermaid diagrams, and brief alignment table.

---

## Milestone 7: Vercel Deployment & Live Verification
- [ ] Link and deploy project to Vercel production using Vercel CLI.
- [ ] Configure environment variables in Vercel and GitHub Secrets safely from the vault.
- [ ] Verify live endpoints: health, AQI fetch, plan generation, what-if simulator, chat streaming, and language toggles.
- [ ] Run Lighthouse and axe audits on the live production URL and document metrics in `docs/METRICS.md` and `README.md`.

---

## Milestone 8: Demo Video & Submission Assets
- [ ] Execute `demo-video-recorder` skill to capture a 90-second 1080p walkthrough on the live URL.
- [ ] Verify shot list: live AQI, profile input, generated plan, impact explainer, what-if simulator, streaming chat, language switch, keyboard navigation, and test coverage proof.
- [ ] Check vault for YouTube/GDrive upload tokens or prepare local recording path.
- [ ] Generate submission files in `/submission` (`changes_summary.txt`, `genai_usage.txt`, `linkedin_post.txt`, `submission_form.txt`, `reel_script.txt`).

---

## Milestone 9: Pre-Submission Gate & Self-Audit
- [ ] Run full pre-submission audit: lint, typecheck, tests with coverage, npm audit, git secret scan, repo size check.
- [ ] Author `SELF_AUDIT.md` scoring all six criteria (all must achieve >= 97/100).
- [ ] Provide final handoff summary to user.
