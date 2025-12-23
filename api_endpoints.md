# API Endpoints Classification

## Backend API Endpoints

### Protected Endpoints

#### **SubscriptionsV2Controller** (`subscriptionsV2.controller.ts`)
- **GET** `/subscription-status`
  - **Request**: None
  - **Response**: `{ status: string }` (e.g., `{ status: 'active' }` or `{ status: 'inactive' }`)
  - **Protection**: Requires user login.

- **GET** `/my`
  - **Request**: None
  - **Response**: `{ user: object }`
  - **Protection**: Requires user login.

- **POST** `/create`
  - **Request**: `{ planId: string }`
  - **Response**: `{ paymentLink: string }`
  - **Protection**: Requires user login.

- **POST** `/confirm`
  - **Request**: `{ sessionId: string }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Requires user login.

#### **UsersController** (`users.controller.ts`)
- **GET** `/`
  - **Request**: None
  - **Response**: `[ { user: object } ]`
  - **Protection**: Admin role required.

- **GET** `/:id`
  - **Request**: None
  - **Response**: `{ user: object }`
  - **Protection**: Admin role required.

- **POST** `/`
  - **Request**: `{ user: object }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Admin role required.

- **PUT** `/:id`
  - **Request**: `{ user: object }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Admin role required.

- **DELETE** `/:id`
  - **Request**: None
  - **Response**: `{ success: boolean }`
  - **Protection**: Admin role required.

#### **TenantsController** (`tenants.controller.ts`)
- **GET** `/`
  - **Request**: None
  - **Response**: `[ { tenant: object } ]`
  - **Protection**: Admin role required.

- **GET** `/ids-names`
  - **Request**: None
  - **Response**: `[ { id: string, name: string } ]`
  - **Protection**: Admin role required.

- **GET** `/:id`
  - **Request**: None
  - **Response**: `{ tenant: object }`
  - **Protection**: Admin role required.

- **POST** `/`
  - **Request**: `{ tenant: object }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Admin role required.

- **PUT** `/:id`
  - **Request**: `{ tenant: object }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Admin role required.

- **DELETE** `/:id`
  - **Request**: None
  - **Response**: `{ success: boolean }`
  - **Protection**: Admin role required.

#### **SubscriptionsController** (`subscriptions.controller.ts`)
- **GET** `/`
  - **Request**: None
  - **Response**: `[ { subscription: object } ]`
  - **Protection**: Requires user login.

- **GET** `/:id`
  - **Request**: None
  - **Response**: `{ subscription: object }`
  - **Protection**: Requires user login.

- **POST** `/`
  - **Request**: `{ subscription: object }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Requires user login.

- **PATCH** `/:id`
  - **Request**: `{ subscription: object }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Requires user login.

- **DELETE** `/:id`
  - **Request**: None
  - **Response**: `{ success: boolean }`
  - **Protection**: Requires user login.

- **GET** `/subscription-status`
  - **Request**: None
  - **Response**: `{ status: string }` (e.g., `{ status: 'active' }` or `{ status: 'inactive' }`)
  - **Protection**: Requires user login.

---

### Public Endpoints

- None explicitly defined.

---

## Frontend API Usage

### Protected Endpoints

#### **Middleware** (`middleware.ts`)
- **POST** `/api/auth/login`
  - **Request**: `{ email: string, password: string }`
  - **Response**: `{ token: string }`
  - **Protection**: None.

- **POST** `/api/auth/signup`
  - **Request**: `{ email: string, password: string, ... }`
  - **Response**: `{ success: boolean }`
  - **Protection**: None.

#### **Campaigns Page** (`pages/campaigns/index.tsx`)
- **GET** `/api/campaigns`
  - **Request**: None
  - **Response**: `[ { campaign: object } ]`
  - **Protection**: Requires user login.

- **POST** `/api/campaigns`
  - **Request**: `{ campaign: object }`
  - **Response**: `{ success: boolean }`
  - **Protection**: Requires user login.

- **POST** `/api/campaigns/:id/meta-post`
  - **Request**: None
  - **Response**: `{ success: boolean }`
  - **Protection**: Requires user login.

- **POST** `/api/campaigns/:id/meta-ads`
  - **Request**: None
  - **Response**: `{ success: boolean }`
  - **Protection**: Requires user login.

#### **Branding Library** (`lib/branding.ts`)
- **GET** `/api/admin/branding/config`
  - **Request**: None
  - **Response**: `{ branding: object }`
  - **Protection**: Admin role required.

---

### Public Endpoints

- None explicitly defined.