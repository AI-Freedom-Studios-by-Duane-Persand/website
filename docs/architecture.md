
# AI Freedom Studios Documentation

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Monorepo Structure](#monorepo-structure)
- [Backend Modules](#backend-modules)
- [Frontend Structure](#frontend-structure)
- [Integrations](#integrations)
- [Security & Best Practices](#security--best-practices)
- [Deployment Guide](#deployment-guide)
- [Operational Procedures](#operational-procedures)
- [Testing & Quality](#testing--quality)
- [Extensibility](#extensibility)

---

## Architecture Overview
AI Freedom Studios is a multi-tenant SaaS platform for campaign management, creative generation, and social publishing. It is designed for clarity, maintainability, and extensibility, using a monorepo structure and modular codebase.

- **Frontend:** Next.js (App Router, public/tenant/admin routes)
- **Backend:** NestJS (modular, all integrations)
- **Database:** MongoDB (Atlas or self-hosted)
- **Job Queue:** Redis (BullMQ) or Agenda
- **Media Storage:** Cloudflare R2 (S3-compatible)
- **Payments:** Stripe (one-time, no webhooks)
- **AI/Publishing:** Gemini (Google AI), Ayrshare (social publishing)


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

---

## Backend Modules
- **AuthModule:** JWT login/signup, guards
- **UsersModule:** CRUD, roles, tenant linkage
- **TenantsModule:** CRUD, plan management
- **SubscriptionsModule:** Stripe integration, subscription state
- **CampaignsModule:** Campaign CRUD, plan enforcement
- **CreativesModule:** Creative CRUD, asset linking
- **StorageModule:** S3/R2 upload, retrieval, plan limits
- **EnginesModule:** Modular AI micro-agents, Gemini integration
- **SchedulingModule:** BullMQ/Agenda, Ayrshare publishing
- **AdminModule:** Integration config, tenant management

## Frontend Structure
- **App Router:** Public, tenant, and admin routes
- **Auth Flows:** Login, signup, subscription gating
- **Billing:** Stripe checkout, plan management
- **Campaigns/Creatives:** CRUD, asset upload UI
- **Admin UI:** Integration configs, tenant management
- **Route Guards:** Auth and subscription status

## Integrations
- **Stripe:** One-time payment, endpoints for billing
- **Gemini:** Modular AI engine, engine runners
- **Ayrshare:** Social publishing, scheduling
- **Cloudflare R2:** S3-compatible media storage, asset uploads

## Security & Best Practices
- All secrets via environment variables
- Encrypted configs (ConfigService, AES-256-GCM)
- Plan limits enforced on all resource usage
- Input validation, error handling, and security hardening

## Deployment Guide
1. **Environment Setup:**
	- Configure `.env` files for all services (MongoDB, Redis, Stripe, R2, Gemini, etc.)
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

## Operational Procedures
- All configuration via environment variables and admin dashboard
- Use admin UI for integration configs and tenant management
- Monitor job queues and worker health
- Regularly review and rotate secrets

## Testing & Quality
- Write unit/integration tests for backend and frontend modules
- Add e2e tests for key user flows (signup, billing, campaign creation, publishing)
- Review and secure all secrets/configs

## Extensibility
- Add new engines, integrations, or plans by extending modules and types in `/shared`
- Modular service structure for easy feature addition

---
For implementation steps, see `.github/prompts/plan-campaignOs.prompt.md` and `.github/prompts/plan-campaignOs-nextSteps.prompt.md`.
