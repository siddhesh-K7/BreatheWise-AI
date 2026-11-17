# Challenge 5 (CelebPlan AI) Post-Mortem & Architecture Analysis

## 1. Stack, Folder Structure, Entry Points, Build & Deploy Setup

### Tech Stack
- **Framework**: Next.js 15.3.3 (App Router), React 19.1.0, TypeScript 5.8.3
- **Styling**: Tailwind CSS v4.1.10 with `@tailwindcss/postcss`
- **Database**: Neon Serverless PostgreSQL with `@neondatabase/serverless` connection pooling
- **AI Integration**: NVIDIA OpenAI-compatible API (`meta/llama-3.1-70b-instruct`) using `openai` SDK (v4.103.0)
- **Validation**: Zod 3.25.67
- **Authentication**: Custom JWT using `jose` v6.0.11 and `bcryptjs` v2.4.3
- **Testing**: Jest 29.7.0 + `ts-jest` 29.3.4 + `@testing-library/react` 16.3.0
- **Icons & UI**: `lucide-react`, `recharts`, `react-markdown`

### Folder Structure & Entry Points
- `src/app/page.tsx`: Landing page
- `src/app/layout.tsx`: Root layout with font definitions and global metadata
- `src/app/dashboard/page.tsx`: Main dashboard managing celebration events
- `src/app/events/[id]/page.tsx`: Deep event overview (monolithic page with vendors, tasks, budget, timeline, guests)
- `src/app/chat/page.tsx`: Interactive AI concierge
- `src/app/api/`: 12 Serverless Route Handlers under Next.js App Router
- `src/lib/`: Core helpers (`ai.ts`, `auth.ts`, `db.ts`, `utils.ts`, `validations.ts`)
- `src/components/`: Split into `layout/` and `ui/`

### Build & Deploy Setup
- `next.config.js`: Defined partial headers, static asset caching, and experimental package imports (`lucide-react`, `date-fns`).
- Deployed to Vercel Serverless environment.

---

## 2. GenAI Integration Analysis

### SDK, Model & Endpoint
- Used the `openai` npm package pointing to `https://integrate.api.nvidia.com/v1` with model `meta/llama-3.1-70b-instruct`.
- In `src/lib/ai.ts`, `getAIClient()` set `dangerouslyAllowBrowser: true`. While invoked server-side in API routes, this flag triggers security warnings and risks leaking keys if imported client-side.

### Prompts & Structured Output
- **No Native Structured Outputs**: Did not use Gemini Schema / JSON mode. Instead, prompts asked the LLM to "Respond ONLY with a valid JSON array of 5 objects".
- **Regex Extraction**: Relied on regex `raw.match(/\[[\s\S]*\]/)` and standard `JSON.parse`. If the LLM returned markdown commentary, reasoning tokens, or syntax truncation, regex extraction either broke or returned malformed data.
- **No Zod Validation on AI Output**: AI responses were loosely coerced (`String(...)`, `Number(...)`) without schema validation.
- **No Streaming**: Responses were waited on synchronously; no SSE or ReadableStream was implemented for chat.
- **Prompt Injection Vulnerability**: Event details and user messages were directly concatenated with template strings without XML/boundary delimiters or injection prevention guards.
- **No Response Caching**: Identical requests re-invoked the model repeatedly, burning API tokens and increasing latency.

---

## 3. Security, Auth, Validation & Headers

### Strengths
- Passwords hashed with `bcryptjs` (salt rounds 12).
- JWTs stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
- Comprehensive Zod schemas for incoming JSON bodies.
- Parameterized SQL queries preventing classic SQL injection.

### Critical Gaps
- **Missing Content-Security-Policy (CSP)**: `next.config.js` did not define a CSP header.
- **Missing HSTS**: `Strict-Transport-Security` was omitted.
- **Permissions-Policy Conflict**: Configured `geolocation=()`, which prevents geolocation APIs.
- **Missing CORS**: API routes did not configure origin checks or CORS headers.
- **In-Memory Rate Limiting Only**: `checkRateLimit` used a simple local Node `Map`, which does not persist across serverless instances and lacked per-route granularity.
- **Secret Hygiene**: While `.env.local` was gitignored, `dangerouslyAllowBrowser: true` in the OpenAI client definition raised a red flag.

---

## 4. Test Setup, Coverage & Untested Areas

### Test Infrastructure
- Jest + `ts-jest` + `@testing-library/react`.
- 7 test files under `__tests__/` with 45+ test cases.

### Untested Areas & Gaps
- **Superficial a11y testing**: `accessibility.test.ts` only asserted that string helpers returned certain class names (`text-success`). Zero DOM-level accessibility tests using `jest-axe` or `@testing-library/react`.
- **Untested UI components**: Component rendering, button states, modals, and keyboard interactions were not tested.
- **Untested API failure paths**: API routes lacked mock tests for upstream provider outages, HTTP 429 rate limits, network timeouts, or malformed payloads.
- **No E2E testing**: No Playwright or Cypress workflows to test end-to-end user journeys.

---

## 5. Accessibility (a11y) Evaluation

### What Was Done
- Landmark tags (`<nav>`, `<main>`, `<section>`).
- Dark palette with high-contrast brass/gold accents.
- Focus visible rings on some interactive elements.

### Deficiencies
- No skip navigation link (`<a href="#main-content">Skip to content</a>`).
- Multiple or inconsistent heading hierarchies (`h1` placement).
- `aria-live` missing for dynamic updates outside chat.
- Color alone communicated status in several badge variants.
- Missing `prefers-reduced-motion` media query wrappers for smooth scroll and CSS animations.
- Static `lang="en"` with no multi-language support (English, Tamil, Hindi).
- Touch target sizes were below 44px on smaller screens.

---

## 6. Root Causes of the Code Quality Score (86/100)

1. **Monolithic Files & Long Functions**:
   - `src/app/events/[id]/page.tsx` was over 450 lines with mixed responsibilities (state management, API calls, modal controllers, data transformation, DOM rendering).
   - Violation of the 40-line function and 250-line file limit.
2. **Entangled Business Logic**:
   - Component files directly executed data manipulation and mathematical logic rather than delegating to isolated domain services.
3. **Magic Numbers & Hardcoded Values**:
   - Time conversions (`1000 * 60 * 60 * 24`), token budgets, and pagination sizes scattered throughout code rather than in a typed configuration module.
4. **Weak Typing & Loose Assertions**:
   - Frequent `any` or loose type coercion in fallback logic (`item: any`).
   - Lack of strict schema-derived TypeScript types for AI structured inputs and outputs.
5. **Missing TSDoc Documentation**:
   - Internal helper methods, component props, and service signatures lacked TSDoc annotations (`@param`, `@returns`, `@throws`).
6. **Permissive ESLint Configuration**:
   - `.eslintrc.json` simply extended `next/core-web-vitals` without `@typescript-eslint/recommended`, `no-explicit-any`, or strict lint rules.
7. **Duplicated Route Logic**:
   - Repeated error handling, JSON serialization, and auth check boilerplate across `api/events/[id]/*` route files.
8. **Lack of Automated Code Quality Verification**:
   - No `jscpd` duplicate code detection or complexity metrics in CI.

---

## 7. Actionable Decision Matrix: Challenge 6

| Action | Pattern / Component | Reason |
|---|---|---|
| **REUSE** | Zod input validation architecture | Solid input validation model; enhance with strict sanitization and coordinate bounding. |
| **REUSE** | App Router Next.js architecture | Clean routing and serverless deployment on Vercel. |
| **REUSE** | Zero-allocation `Intl` formatters | High-efficiency formatting pattern for dates and metrics. |
| **REUSE** | Structured fallback pattern | Essential for resilience during API outages, but must be fully typed and deterministic. |
| **REFACTOR** | AI Client & Structured Outputs | Replace OpenAI client with official `@google/genai` (Google Gen AI SDK); use `responseSchema` and Zod validation. |
| **REFACTOR** | Rate Limiting & Security Headers | Add full CSP, HSTS, Permissions-Policy, strict CORS, and route-level rate limiting. |
| **REFACTOR** | Chat Architecture | Implement Server-Sent Events (SSE) / streaming response with injection-resistant system prompt. |
| **REFACTOR** | Architecture Layering | Strictly enforce: `routes/` -> `services/` -> `domain/` -> `validators/` -> `components/` -> `hooks/`. Max 40 lines/function, 250 lines/file. |
| **DO NOT CARRY OVER** | Loose regex JSON extraction | Replace with Gemini Structured Outputs + Zod validation with 1-shot retry and deterministic fallback. |
| **DO NOT CARRY OVER** | `dangerouslyAllowBrowser: true` | AI calls must be strictly server-side. |
| **DO NOT CARRY OVER** | Monolithic page components | Modularize all UI into dedicated components under 250 lines. |
| **DO NOT CARRY OVER** | Jest without component a11y | Adopt Vitest + React Testing Library + `jest-axe` + Playwright E2E. |
| **DO NOT CARRY OVER** | Unchecked status colors | Guarantee non-color-only indicators (icons + text + pattern) meeting WCAG 2.2 AA. |
