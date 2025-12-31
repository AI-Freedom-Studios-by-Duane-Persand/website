# Documentation

This folder contains comprehensive documentation for the AI Freedom Studios campaign automation platform.

## 📁 Folder Structure

### `/integrations/` - Third-Party Integrations
Integration guides and setup instructions for external services:
- **meta.md** - Facebook Pages & Instagram OAuth and posting
- **ayrshare.md** - Multi-platform posting (Twitter, LinkedIn, YouTube, TikTok)
- **replicate.md** - AI image and video generation

### `/architecture/` - System Design
Technical architecture documentation:
- System overview and component diagrams
- Database schema and relationships
- API design patterns
- Authentication flows

### `/guides/` - Implementation Guides
Step-by-step guides and how-tos:
- Getting started and setup
- Feature implementation
- Deployment procedures
- Troubleshooting

### `/api/` - API Reference
API endpoint documentation:
- Authentication endpoints
- Campaign management
- Creative generation
- Social account management
- Publishing and scheduling
- Analytics

## 🚀 Quick Navigation

**Setting up the project?**
- Start with the main [QUICK_START.md](../QUICK_START.md)
- Then read [Getting Started](../GETTING_STARTED.md)

**Connecting social accounts?**
- Free option: [Meta Integration](./integrations/meta.md) (Facebook & Instagram)
- Multi-platform: [Ayrshare Integration](./integrations/ayrshare.md) (paid)

**Deploying to production?**
- Check [Post Implementation Checklist](../POST_IMPLEMENTATION_CHECKLIST.md)
- Review [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)

**Understanding the architecture?**
- Read [Campaign Architecture](../CAMPAIGN_ARCHITECTURE.md)
- Check [System Overview](./architecture/overview.md)

## 📚 Documentation Index

### Integration Guides
- [Meta (Facebook/Instagram) API](./integrations/meta.md)
- [Ayrshare Multi-Platform](./integrations/ayrshare.md)
- [Replicate AI Generation](./integrations/replicate.md)

### Architecture
- [System Architecture](../ARCHITECTURE.md)
- [Campaign Architecture](../CAMPAIGN_ARCHITECTURE.md)
- [Database Schema](./architecture/database-schema.md)

### Setup & Deployment
- [Quick Start](../QUICK_START.md)
- [Getting Started](../GETTING_STARTED.md)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)
- [Post-Launch Checklist](../POST_IMPLEMENTATION_CHECKLIST.md)

### Features
- [Early Access System](../EARLY_ACCESS_IMPLEMENTATION.md)
- [Subscription Management](../SUBSCRIPTIONS.md)
- [Campaign Management](./guides/campaigns.md)

### Reference
- [API Endpoints](../api_endpoints.md)
- [Ayrshare Max Pack Info](../AYRSHARE_MAX_PACK_REQUIRED.md)

## 💡 Key Concepts

### Social Media Integration
- **Meta API (Free)**: Direct Facebook Pages & Instagram posting via OAuth
  - No subscription fees
  - Per-account rate limits
  - Best for Facebook/Instagram only

- **Ayrshare (Paid)**: Multi-platform unified API
  - Supports 13+ networks
  - Max Pack required for user OAuth: $200+/month
  - Best for multiple platform needs

### Authentication
- Email/password authentication
- OAuth 2.0 for social platforms
- JWT tokens for session management
- Role-based access control

### Features
- Campaign management
- AI content generation (via Replicate)
- Social media posting and scheduling
- Analytics and insights
- Multi-tenant support
- Early access system
- Subscription management

## 🔗 External Resources

- [Meta Developers](https://developers.facebook.com/)
- [Ayrshare Documentation](https://docs.ayrshare.com/)
- [Replicate AI](https://replicate.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)

## ✏️ Documentation Standards

- Use clear, concise language
- Include code examples where relevant
- Keep formatting consistent
- Link to related documentation
- Update docs with code changes
- Review quarterly for accuracy

Last Updated: December 31, 2024