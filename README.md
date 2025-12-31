# AI Freedom Studios - Campaign Automation Platform

A production-ready multi-tenant SaaS platform for campaign management, creative generation, and social media publishing.

## 🚀 Quick Links

- **Getting Started**: See [QUICK_START.md](./QUICK_START.md) or [Getting Started Guide](./docs/guides/GETTING_STARTED.md)
- **Documentation**: See [/docs/](./docs/) for complete documentation
- **API Reference**: See [/docs/api/](./docs/api/) for endpoint details
- **Social Integration**: 
  - [Meta (Facebook/Instagram)](./docs/integrations/meta.md) - Free, recommended
  - [Ayrshare](./docs/integrations/ayrshare.md) - Multi-platform, paid

## 📋 Project Structure

```
├── /frontend/          Next.js frontend application
├── /api/               NestJS backend API
├── /shared/            TypeScript types and DTOs
├── /docs/              Complete documentation
│   ├── /integrations/  Social media & platform setup guides
│   ├── /architecture/  System design and architecture
│   ├── /guides/        Implementation guides and how-tos
│   └── /api/           API reference documentation
├── QUICK_START.md      Quick start guide for new users
├── SUBSCRIPTIONS.md    Subscription plans and pricing
└── README.md           This file
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Backend**: NestJS with MongoDB
- **Database**: MongoDB (Atlas or self-hosted)
- **Job Queue**: Redis + BullMQ
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Stripe
- **AI**: Gemini & Replicate
- **Social**: Meta Graph APIs & Ayrshare

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- MongoDB connection
- Stripe API keys (for payments)
- Meta App credentials (for social posting)

### Installation

```bash
# Install all dependencies
npm install

# Start development servers
npm run dev:api      # Backend on port 3001
npm run dev:frontend # Frontend on port 3000
```

### Configuration

1. Copy `.env.example` to `.env` in `/api` and `/frontend`
2. Configure environment variables:
   - Database: `MONGODB_URI`
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`
   - Meta: `META_APP_ID`, `META_APP_SECRET`
   - Storage: `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`

3. See [/docs/guides/](./docs/guides/) for detailed setup

## 📚 Documentation Guide

### For First-Time Users
1. Read [QUICK_START.md](./QUICK_START.md)
2. Complete environment setup
3. Run development servers
4. Create first campaign

### For Deploying to Production
1. See [/docs/guides/POST_IMPLEMENTATION_CHECKLIST.md](./docs/guides/IMPLEMENTATION_CHECKLIST.md)
2. Configure all environment variables
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Start services with pm2 or systemd

### For Understanding Architecture
1. Read [/docs/architecture/system-overview.md](./docs/architecture/system-overview.md)
2. Review [/docs/architecture/campaign-management.md](./docs/architecture/campaign-management.md)
3. Check [/docs/api/](./docs/api/) for endpoint details

### For Connecting Social Accounts
- **Facebook/Instagram**: [/docs/integrations/meta.md](./docs/integrations/meta.md)
- **Multi-platform**: [/docs/integrations/ayrshare.md](./docs/integrations/ayrshare.md)
- **Subscription Details**: [SUBSCRIPTIONS.md](./SUBSCRIPTIONS.md)

## 🎯 Core Features

### Campaign Management
- Strategy versioning and planning
- Multi-step approval workflow
- Content creation (AI, manual, hybrid)
- Asset management and Cloudflare R2 integration
- Automatic scheduling with conflict detection

### Social Publishing
- **Meta APIs**: Direct Facebook Pages & Instagram posting (free)
- **Ayrshare**: Multi-platform publishing (13+ networks, paid)
- OAuth-based account connection
- Scheduled and instant publishing
- Media handling and optimization

### Creative Generation
- AI-powered content creation
- Image and video generation
- Caption and hashtag generation
- Multiple AI provider support (Poe, Replicate)
- Fallback mechanisms for reliability

### Content Management
- Multi-tenant isolation
- Role-based access control
- Audit trails and revision history
- Subscription-based feature gating
- Early access system

## 💰 Subscription Plans

See [SUBSCRIPTIONS.md](./SUBSCRIPTIONS.md) for:
- Starter: $29/month
- Pro: $99/month
- Enterprise: Custom pricing

## 🔐 Security

- JWT-based authentication
- OAuth 2.0 for social platforms
- Encrypted token storage
- Environment-based secrets
- Multi-tenant data isolation
- Rate limiting and input validation

## 🚢 Deployment

### Development
```bash
npm run dev:api
npm run dev:frontend
```

### Production
```bash
npm run build:all
npm start:api
npm start:frontend
```

See [/docs/guides/IMPLEMENTATION_CHECKLIST.md](./docs/guides/IMPLEMENTATION_CHECKLIST.md) for complete deployment checklist.

## 🐛 Troubleshooting

See [/docs/guides/](./docs/guides/) for:
- MongoDB connection issues
- Stripe integration troubleshooting
- Social media authentication issues
- Media generation problems
- API errors and solutions

## 📖 API Documentation

Complete API reference: [/docs/api/api_endpoints.md](./docs/api/api_endpoints.md)

Example endpoints:
- `POST /auth/signup` - User registration
- `POST /campaigns` - Create campaign
- `POST /creatives` - Generate creative
- `POST /meta/facebook/post` - Post to Facebook
- `POST /meta/instagram/post` - Post to Instagram

## 🔗 External Resources

- [Meta Developers](https://developers.facebook.com/)
- [Ayrshare Documentation](https://docs.ayrshare.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Update documentation if needed
4. Commit with clear messages
5. Push and create a pull request

## 📄 License

Copyright © 2024 AI Freedom Studios. All rights reserved.

## 📞 Support

For issues, questions, or suggestions:
1. Check [/docs/guides/](./docs/guides/) for existing solutions
2. Review API documentation in [/docs/api/](./docs/api/)
3. Contact support team

---

**Last Updated**: December 31, 2024
