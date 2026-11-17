# Contributing Guidelines (CONTRIBUTING.md)

Thank you for contributing to **AirWise**!

---

## Code Quality Standards (Target: 97+)

All pull requests and code modifications must uphold these invariants:
1. **TypeScript Strict Mode**: Zero TypeScript errors (`npm run typecheck`). Zero `any` types.
2. **ESLint & Prettier**: Zero warnings (`npm run lint`). Code must pass `npm run format:check`.
3. **Complexity & File Constraints**:
   - Maximum 40 lines per function.
   - Maximum 250 lines per file.
   - Zero duplicated logic.
4. **TSDoc Documentation**: All exported types, interfaces, services, and components must include TSDoc annotations.
5. **Testing & Coverage**:
   - All tests must pass: `npm test`.
   - Coverage thresholds: >= 90% lines, >= 85% branches (`npm run test:coverage`).
   - Every interactive component must have an automated `axe-core` accessibility test.

---

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env.local
   ```
4. Run local development server:
   ```bash
   npm run dev
   ```
5. Run test suite:
   ```bash
   npm test
   npm run test:coverage
   ```
6. Commit using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).
