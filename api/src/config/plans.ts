// api/src/config/plans.ts
import { Plan } from '../../../shared/types';

export const plans: Plan[] = [
  {
    planId: 'starter',
    name: 'Starter',
    priceCents: 2900,
    interval: 'monthly',
    limits: {
      campaigns: 3,
      postsPerMonth: 30,
      users: 3,
    },
  },
  {
    planId: 'pro',
    name: 'Pro',
    priceCents: 9900,
    interval: 'monthly',
    limits: {
      campaigns: 10,
      postsPerMonth: 100,
      users: 10,
    },
  },
  {
    planId: 'agency',
    name: 'Agency',
    priceCents: 29900,
    interval: 'monthly',
    limits: {
      campaigns: 50,
      postsPerMonth: 500,
      users: 50,
    },
  },
];
