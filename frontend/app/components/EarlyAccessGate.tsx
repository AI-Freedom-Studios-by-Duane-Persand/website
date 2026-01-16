'use client';

import React from 'react';

interface EarlyAccessGateProps {
  children: React.ReactNode;
  hasAccess: boolean;
}

/**
 * EarlyAccessGate: Renders children without blocking.
 * Early access is now a feature flag/tier indicator, not a blocker.
 * If you want to enforce early access, this component can be enhanced later.
 */
export default function EarlyAccessGate({ children, hasAccess }: EarlyAccessGateProps) {
  // Simply render children for all users
  // Early access status can be used for feature flags or UI indicators elsewhere
  return <>{children}</>;
}
