# API Reference

Complete API endpoint documentation for the AI Freedom Studios platform.

## 📚 API Documentation

### REST Endpoints
See [`/api_endpoints.md`](../../api_endpoints.md) in the project root for:
- Authentication endpoints
- Campaign management endpoints
- Creative management endpoints
- Storage and asset endpoints
- Social media integration endpoints
- Admin endpoints

### Social Integration Endpoints

#### Meta (Facebook/Instagram)
- `GET /meta/auth/url` - Get OAuth authorization URL
- `POST /meta/auth/token` - Exchange code for tokens
- `POST /meta/auth/long-lived-token` - Generate long-lived token
- `GET /meta/pages` - List connected Facebook Pages
- `POST /meta/facebook/post` - Post text to Facebook
- `POST /meta/facebook/photo` - Post photo to Facebook
- `POST /meta/instagram/post` - Post to Instagram
- `POST /meta/instagram/container` - Create Instagram media container
- `POST /meta/instagram/publish` - Publish Instagram media

#### Ayrshare
See [Ayrshare Integration](../integrations/ayrshare.md) for:
- User linking endpoints (requires Max Pack subscription)
- Post creation and publishing
- Profile management
- Platform support matrix

## 🔑 Authentication

### Bearer Token
All protected endpoints require a JWT token in the Authorization header:
```bash
Authorization: Bearer <jwt_token>
```

### OAuth 2.0
Social platform authentication uses standard OAuth 2.0 flow:
1. Redirect user to authorization URL
2. User grants permission
3. Platform returns authorization code
4. Exchange code for access token
5. Use token for API calls

## 📊 Response Format

Standard response format for all API endpoints:

### Success Response (200)
```json
{
  "success": true,
  "data": {
    // endpoint-specific data
  }
}
```

### Error Response (400, 401, 403, 404, 500)
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔒 Error Codes

- `BAD_REQUEST` (400) - Invalid input or malformed request
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - State conflict (e.g., duplicate entry)
- `INTERNAL_ERROR` (500) - Server error

## 🌐 Base URLs

### Development
- API: `http://localhost:3001`
- Frontend: `http://localhost:3000`

### Production
- API: `https://api.yourdomain.com`
- Frontend: `https://yourdomain.com`

## 📖 Integration Guides

For detailed setup instructions, see:
- [Meta Graph APIs](../integrations/meta.md)
- [Ayrshare Multi-Platform](../integrations/ayrshare.md)

## 🔗 Related Documentation

- **Endpoint Details**: See `/api_endpoints.md` in project root
- **Architecture**: See `/docs/architecture/` for system design
- **Implementation**: See `/docs/guides/` for how-to guides
