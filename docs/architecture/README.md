# Architecture Documentation

This folder contains technical architecture documentation for the AI Freedom Studios platform.

## 📚 Contents

### [System Overview](./system-overview.md)
High-level architecture overview including:
- Core platform components (Next.js, NestJS, MongoDB)
- Monorepo structure and dependency management
- Backend modules and their responsibilities
- Frontend structure and routing
- Integrations (Meta APIs, Ayrshare, Stripe, Gemini, R2)
- Security practices and deployment guide

### [Campaign Management Architecture](./campaign-management.md)
Detailed campaign management system design:
- Strategy versioning and lifecycle
- Approval workflow (4-gate approval system)
- Scheduling with conflict detection
- Asset management and replacement
- Service interfaces and DTOs
- API endpoints
- Audit trail and multi-tenant isolation
- Testing strategies and best practices

## 🏗️ Core Concepts

### Strategy-First Design
Campaigns are built around a versioned strategy that drives all downstream content and approval workflows.

### Multi-Tenant Architecture
Complete isolation between tenants with enforced tenant checks on all operations.

### Audit Trail
Every operation is logged with full change history and status tracking for compliance and debugging.

### Approval Workflows
Four independent approval gates ensure quality control:
1. Strategy approval
2. Content approval
3. Schedule approval
4. Ads configuration approval

## 🔗 Related Documentation

- **Integration Guides**: See `/docs/integrations/` for Meta and Ayrshare setup
- **Implementation Guides**: See `/docs/guides/` for deployment and operations
- **API Reference**: See `/docs/api/` for endpoint documentation
- **Root Documentation**: 
  - `ARCHITECTURE.md` - System-wide architecture overview
  - `CAMPAIGN_ARCHITECTURE.md` - Campaign system details

## 🚀 Quick Links

- **Getting Started**: See `QUICK_START.md` in project root
- **Deployment**: See `POST_IMPLEMENTATION_CHECKLIST.md` in project root
- **System Overview**: See `IMPLEMENTATION_SUMMARY.md` in project root
