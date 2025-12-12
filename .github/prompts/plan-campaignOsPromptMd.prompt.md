## Plan: Production-Ready Multi-Tenant SaaS “Campaign OS” (Monorepo, No Docker)

This plan outlines the step-by-step approach to incrementally build a modular, production-grade, multi-tenant SaaS platform (“campaign OS”) as described. The focus is on clarity, maintainability, and extensibility, using a monorepo structure, with all core features gated by subscription, and Stripe one-time payments (no webhooks). The stack is Next.js (frontend), NestJS (backend), MongoDB, Redis (or Agenda), Cloudflare R2, and integrations as specified.

### Steps

1. Set up Monorepo Structure
   - Create /frontend (Next.js), /api (NestJS), /shared (TypeScript types), /docs folders.
   - Add basic README and initial documentation in /docs.

2. Define TypeScript Interfaces & Mongoose Schemas
   - In /shared, define interfaces for all collections (tenants, users, subscriptions, etc.).
   - In /api, create Mongoose schemas/models for each collection.

3. Implement Core NestJS Modules
   - Scaffold AuthModule, UsersModule, TenantsModule, SubscriptionsModule.
   - Implement JWT-based authentication and role-based guards.
   - Add business logic for subscription periods and gating.

4. Stripe Integration (No Webhooks)
   - Implement StripeService with createCheckoutSession and verifyCheckoutSession.
   - Add endpoints for billing flows.
   - Store and update subscription state in MongoDB.

5. ConfigService & Integration Encryption
   - Implement ConfigService for encrypted integration configs (AES-256-GCM).
   - Add helpers for encrypt/decrypt using env key.
   - Scaffold IntegrationsModule and AdminModule for config CRUD.

6. Implement EnginesModule (AI Micro-Agents)
   - Create modular engine interfaces (StrategyEngine, CopyEngine, etc.).
   - Stub GeminiClient and engine runners.
   - Log engine runs in engineRuns collection.

7. Scheduling & Social Publishing
   - Implement SchedulingModule and SocialPublisher abstraction.
   - Integrate AyrsharePublisher for organic post publishing.
   - Set up worker/queue system (BullMQ + Redis or Agenda).

8. Media Storage & User Asset Uploads via Cloudflare R2
   - Implement StorageService using S3-compatible API.
   - Add upload and retrieval methods.
   - Allow users to upload their own assets (images, videos, etc.) via the frontend.
   - Store uploaded media URLs in creatives and brandProfiles.
   - Enforce plan limits and security on asset uploads.

9. Frontend (Next.js) Scaffolding & Asset Uploads
   - Set up public, tenant, and admin routes.
   - Implement auth, billing, dashboard, campaign, and admin UIs.
   - Add UI for uploading assets to creatives (drag-and-drop or file picker).
   - Add route guards for auth and subscription status.

10. Admin Dashboard
    - Implement admin UI for integration configs and tenant management.
    - Add manual override features for subscriptions.

### Further Considerations

1. Database Hosting: Use MongoDB Atlas for production, but support self-hosted MongoDB for flexibility.
2. Job Queue: Prefer Redis + BullMQ, but fall back to Agenda if Redis is unavailable.
3. Secrets Management: Never hard-code secrets; always use ConfigService and environment variables.
4. Testing & Extensibility: Design modules for easy extension (e.g., new engines, integrations, or plans).
5. Deployment: Use pm2 or systemd for process management; configure Nginx as reverse proxy.

---

Please review this plan. Let me know if you want to adjust the order, add/remove steps, or focus on a specific area first.
