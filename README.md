
# AI Freedom Studios: Production-Ready Multi-Tenant SaaS Platform

## Overview
AI Freedom Studios is a modular, production-grade, multi-tenant SaaS platform for campaign management, built with a monorepo structure. It features:
- Next.js frontend
- NestJS backend
- MongoDB (Atlas or self-hosted)
- Redis (BullMQ) or Agenda for job queues
- Cloudflare R2 for media storage
- Stripe for one-time payments (no webhooks)
- Gemini (Google AI) and Ayrshare integrations
- Secure, extensible, and fully subscription-gated


## Monorepo Structure
```
/frontend   # Next.js (App Router, public/tenant/admin routes)
/api        # NestJS (all backend modules, integrations)
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

## Key Features
- Multi-tenant architecture: tenants, users, roles, and permissions
- JWT authentication, role-based guards
- Stripe billing: one-time payments, subscription gating
- Encrypted integration configs (AES-256-GCM)
- Modular AI engines (Gemini, etc.)
- Scheduling and social publishing (Ayrshare)
- S3-compatible media storage (Cloudflare R2)
- User asset uploads (images, videos, etc.)
- Admin dashboard for config and tenant management

## Backend Modules
- **AuthModule**: JWT login/signup, guards
- **UsersModule**: CRUD, roles, tenant linkage
- **TenantsModule**: CRUD, plan management
- **SubscriptionsModule**: Stripe integration, subscription state
- **CampaignsModule**: Campaign CRUD, plan enforcement
- **CreativesModule**: Creative CRUD, asset linking
- **StorageModule**: S3/R2 upload, retrieval, plan limits
- **EnginesModule**: Modular AI micro-agents, Gemini integration
- **SchedulingModule**: BullMQ/Agenda, Ayrshare publishing
- **AdminModule**: Integration config, tenant management

## Frontend
- Next.js App Router
- Auth, billing, dashboard, campaign, creative, and admin UIs
- File upload UI for creatives (drag-and-drop/file picker)
- Route guards for auth and subscription

## Integrations
- **Stripe**: One-time payment, no webhooks, billing endpoints
- **Gemini**: AI engine, modular runners
- **Ayrshare**: Social publishing
- **Cloudflare R2**: S3-compatible media storage

## Security & Best Practices
- All secrets via environment variables
- Encrypted configs (ConfigService)
- Plan limits enforced on all resource usage
- Input validation, error handling, and security hardening

## Deployment
- Use pm2 or systemd for process management
- Nginx as reverse proxy for Next.js and NestJS
- Environment files for MongoDB, Redis, Stripe, R2, Gemini, etc.

## Testing
- Unit/integration tests for backend/frontend modules (recommended)
- e2e tests for key user flows (recommended)

## Extensibility
- Add new engines, integrations, or plans by extending modules and types in `/shared`
- Modular service structure for easy feature addition

## Operational Procedures
- See `/docs` for deployment, environment setup, and operational guides
- All configuration via environment variables and admin dashboard

---
For detailed step-by-step implementation, see `.github/prompts/plan-campaignOs.prompt.md` and `.github/prompts/plan-campaignOs-nextSteps.prompt.md`.