## Plan: Add Comprehensive Logging to AI Freedom Studios

This plan introduces robust, production-grade logging across the backend (NestJS) and, where appropriate, the frontend (Next.js) of the AI Freedom Studios SaaS platform. The goal is to ensure all critical actions, errors, and external API interactions are logged for observability, debugging, and audit purposes.

### Steps
1. Integrate a structured logger (NestJS Logger, Winston, or Pino) in `/api` and configure log levels.
2. Add request/response logging middleware in `/api` for all endpoints.
3. Log authentication, billing, external API calls, and background jobs in relevant services/controllers.
4. Implement error logging and optionally integrate with a service like Sentry.
5. Document logging strategy and log locations in `/docs`.

### Further Considerations
1. Should logs be persisted (file, cloud, or log aggregator) or just console?
2. Add log redaction for sensitive data (PII, secrets).
3. Optionally add frontend error logging for user actions and API failures.

---

### Summary of What’s Already Implemented

- Modular monorepo: `/frontend` (Next.js), `/api` (NestJS), `/shared` (types), `/docs`
- All core modules, CRUD, business logic, and integrations (Stripe, Gemini, Ayrshare, R2)
- Centralized dependency management (npm workspaces)
- Asset upload, plan gating, admin UI, and all major flows
- Linting, formatting, and TypeScript config
- No comprehensive logging yet

---

**Save this as `.github/prompts/plan-logging.prompt.md` for future implementation.**
