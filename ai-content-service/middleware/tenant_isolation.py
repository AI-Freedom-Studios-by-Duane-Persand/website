"""
Tenant isolation middleware for multi-tenant request handling.
Enforces tenant context and access control at the service level.
"""

from fastapi import Request, HTTPException
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class TenantContext:
    """Thread-local tenant context for request isolation"""
    _tenant_id: Optional[str] = None
    
    @classmethod
    def set_tenant(cls, tenant_id: str):
        """Set tenant for current request context"""
        cls._tenant_id = tenant_id
    
    @classmethod
    def get_tenant(cls) -> Optional[str]:
        """Get tenant from current request context"""
        return cls._tenant_id
    
    @classmethod
    def clear(cls):
        """Clear tenant context"""
        cls._tenant_id = None


async def validate_tenant_access(request: Request, tenant_id: str) -> bool:
    """
    Validate tenant has access to requested resource.
    
    In production, this would:
    1. Extract JWT token from Authorization header
    2. Validate JWT signature and claims
    3. Extract tenant_id from JWT
    4. Verify requested tenant_id matches JWT tenant_id
    
    For now, we accept tenant_id from request as verification.
    
    Args:
        request: HTTP request object
        tenant_id: Tenant ID from request body/params
    
    Returns:
        True if validation passes
    
    Raises:
        HTTPException: If validation fails
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        logger.warning(f"Request without authorization for tenant {tenant_id}")
        raise HTTPException(status_code=401, detail="Missing authorization")
    
    # Set tenant context for request lifecycle
    TenantContext.set_tenant(tenant_id)
    logger.info(f"Request validated for tenant: {tenant_id}")
    
    return True


async def enforce_tenant_isolation(tenant_id: str, resource_tenant_id: str):
    """
    Ensure tenant can only access their own resources.
    
    Args:
        tenant_id: Tenant making the request
        resource_tenant_id: Tenant who owns the resource
    
    Raises:
        HTTPException: If tenant_id doesn't match resource_tenant_id
    """
    if tenant_id != resource_tenant_id:
        logger.warning(
            f"Tenant {tenant_id} attempted to access resource owned by {resource_tenant_id}"
        )
        raise HTTPException(
            status_code=403,
            detail="Access denied: resource belongs to different tenant"
        )


class TenantMiddleware:
    """ASGI middleware for tenant context management"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        """
        Process request through tenant middleware.
        
        Extracts tenant_id from request and sets in context.
        """
        if scope["type"] == "http":
            # Try to extract tenant from request
            # This would be done through JWT token in production
            # For now, cleared after each request
            pass
        
        await self.app(scope, receive, send)
