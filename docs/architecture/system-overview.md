# AI Freedom Studios - System Overview

## Architecture Overview
AI Freedom Studios is a multi-tenant SaaS platform for campaign management, creative generation, and social publishing. It is designed for clarity, maintainability, and extensibility, using a monorepo structure and modular codebase.

- **Frontend:** Next.js (App Router, public/tenant/admin routes)
- **Backend:** NestJS (modular, all integrations)
- **Database:** MongoDB (Atlas or self-hosted)
- **Job Queue:** Redis (BullMQ) or Agenda
- **Media Storage:** Cloudflare R2 (S3-compatible)
- **Payments:** Stripe (one-time, no webhooks)
- **AI/Publishing:** Gemini (Google AI), Meta APIs (social publishing)

## Monorepo Structure
```
/frontend   # Next.js frontend
/api        # NestJS backend
/shared     # TypeScript types, DTOs, interfaces
/docs       # Documentation, deployment, operational guides
package.json # Root, manages all dependencies via npm workspaces
```

## Centralized Dependency Management
This monorepo uses **npm workspaces** for unified dependency management and setup.

### Install All Dependencies
From the root of the repo:

```sh
npm install
```

This will install all dependencies for `/api`, `/frontend`, and `/shared`.

### Useful Scripts
- `npm run dev:api` – Start NestJS backend in dev mode
- `npm run dev:frontend` – Start Next.js frontend in dev mode
- `npm run build:all` – Build both backend and frontend

You can also run scripts in each workspace using `npm --workspace <name> run <script>`.

## Backend Modules
- **AuthModule:** JWT login/signup, guards
- **UsersModule:** CRUD, roles, tenant linkage
- **TenantsModule:** CRUD, plan management
- **SubscriptionsModule:** Stripe integration, subscription state
- **CampaignsModule:** Campaign CRUD, plan enforcement
- **CreativesModule:** Creative CRUD, asset linking
- **StorageModule:** S3/R2 upload, retrieval, plan limits
- **EnginesModule:** Modular AI micro-agents, Gemini integration
- **SocialModule:** Meta and Ayrshare integrations for publishing
- **SchedulingModule:** BullMQ/Agenda, publishing orchestration
- **AdminModule:** Integration config, tenant management

## Frontend Structure
- **App Router:** Public, tenant, and admin routes
- **Auth Flows:** Login, signup, subscription gating
- **Billing:** Stripe checkout, plan management
- **Campaigns/Creatives:** CRUD, asset upload UI
- **Admin UI:** Integration configs, tenant management
- **Route Guards:** Auth and subscription status
- **Social Integration:** Meta OAuth callback, account connection

## Integrations
- **Meta Graph APIs:** Native Facebook Pages & Instagram posting (free, no subscription)
- **Ayrshare:** Multi-platform publishing (paid, Max Pack required for user OAuth)
- **Stripe:** One-time payment, endpoints for billing
- **Gemini:** Modular AI engine, engine runners
- **Cloudflare R2:** S3-compatible media storage, asset uploads

## Security & Best Practices
- All secrets via environment variables
- Encrypted configs (ConfigService, AES-256-GCM)
- Plan limits enforced on all resource usage
- Input validation, error handling, and security hardening
- OAuth 2.0 for social platform authentication
- JWT tokens for session management

## Deployment Guide
1. **Environment Setup:**
   - Configure `.env` files for all services (MongoDB, Redis, Stripe, R2, Gemini, Meta API keys, etc.)
   - Never commit secrets; use environment variables
2. **Process Management:**
   - Use pm2 or systemd to run backend and frontend
3. **Reverse Proxy:**
   - Set up Nginx to proxy requests to Next.js and NestJS
4. **Database:**
   - Use MongoDB Atlas for production, or self-hosted MongoDB
5. **Job Queue:**
   - Prefer Redis + BullMQ, fallback to Agenda if Redis unavailable
6. **Media Storage:**
   - Configure Cloudflare R2 credentials and bucket
7. **OAuth Callback URLs:**
   - Meta: `https://yourdomain.com/auth/meta/callback`
   - Configure in Meta Developers dashboard

## Operational Procedures
- All configuration via environment variables and admin dashboard
- Use admin UI for integration configs and tenant management
- Monitor job queues and worker health
- Regularly review and rotate secrets
- Track OAuth token expiration and refresh schedules

## Testing & Quality
- Write unit/integration tests for backend and frontend modules
- Add e2e tests for key user flows (signup, billing, campaign creation, publishing)
- Review and secure all secrets/configs

## Extensibility
- Add new engines, integrations, or plans by extending modules and types in `/shared`
- Modular service structure for easy feature addition
- Support for additional social platforms via new service modules

## Campaign Flow with Asset Management

### Overview
The campaign flow integrates asset management for campaign-specific content and has been updated to support multiple social publishing platforms.

### Key Components
1. **Strategy & Planning**:
   - Introduced a versioned `Strategy` model with fields for platforms, goals, audience, and content pillars.
   - Downstream artifacts are marked as "needs review" when strategy changes.

2. **Content Creation**:
   - Added support for AI-generated, user-uploaded, and hybrid content.
   - Integrated with the Gemini API for AI model selection and content generation.
   - Enabled selective regeneration of content (e.g., captions, images).

3. **Asset Management**:
   - Extended the `StorageService` to upload, tag, and reuse assets in Cloudflare R2.
   - Added support for replacing assets and updating references in campaigns.
   - Linked assets to campaigns and strategy versions.

4. **Social Publishing**:
   - Multiple integration options: Meta APIs (free) or Ayrshare (paid, multi-platform)
   - Account management with OAuth authentication
   - Scheduling and batch publishing support

5. **Frontend Enhancements**:
   - Updated the campaign creation UI to include fields for AI model selection and asset management.
   - Added an asset library UI for managing uploaded and generated assets.
   - OAuth-based account connection for social platforms

6. **Backend Enhancements**:
   - Updated `CampaignsService` to integrate strategy, content, and asset management.
   - Enhanced engines to support AI model selection and upload generated content to R2.
   - Multi-platform publishing orchestration

### Benefits
- **Scalability**: Handles large volumes of campaigns and assets efficiently.
- **Security**: Encrypts R2 and OAuth credentials, validates asset uploads.
- **Flexibility**: Multiple publishing platform options to meet different needs.
- **Extensibility**: Supports additional storage providers and AI engines in the future.

---
For implementation steps, see documentation in `/docs/guides/` and `/docs/integrations/`.
