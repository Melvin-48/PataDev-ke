# PataDev Ke - Project & API Documentation

This document provides a comprehensive overview of the **PataDev Ke** backend service. It details the project objectives, architecture, module layout, database schema, domain events, deployment instructions, and acts as an API Route Reference guide for frontend developers and team members.

---

## 1. Project Overview & Objectives

**PataDev Ke** is a developer-to-business matching and project management platform. Its primary goal is to connect local businesses in Kenya (seeking CRM or POS systems) with qualified software developers. 

The platform handles the entire lifecycle of a project build:
1. **Brief & Matching**: Clients publish project briefs. Developers submit bids.
2. **Messaging & Collaboration**: Once a bid is accepted, a secure realtime message channel opens between the developer and the client.
3. **Milestone Management**: The project is divided into distinct payment/work milestones.
4. **Payment Intermediation**: The platform acts as a trusted escrow intermediary. Clients fund milestones, funds are held by the platform ledger, and are disbursed to developers upon milestone approval (confirmed by administrators during the MVP stage).

### System Roles
*   **`CLIENT`**: Represents the business owner. They create projects, review bids, accept/decline bids, manage and approve milestones, and initiate escrow payments.
*   **`DEVELOPER`**: Represents the freelance engineer. They browse open projects, place bids, message clients (once matched), submit milestones for review, and receive milestone payouts.
*   **`ADMIN`**: Represents platform administrators. They verify developer accounts, moderate project listings, resolve dispute reports, and confirm financial payouts.
*   **`SUPER_ADMIN`**: Platform superusers with authority to suspend/ban accounts, promote/demote administrators, configure platform commission fees, and view financial audits.

---

## 2. Architecture & Module Design

The codebase is built on **NestJS 11** and uses **Prisma 7** with PostgreSQL connection pooling (`@prisma/adapter-pg`) connecting to **Supabase PostgreSQL**.

### Module Layout
Every feature module under `src/modules/` adheres to a strict layered structure:
*   `controller/`: Handles incoming HTTP requests, defines routes, validates input using DTOs, and attaches Swagger documentation.
*   `service/`: House of business logic, state transitions, and domain rules.
*   `dto/`: Request/Response schemas, decorated with `class-validator` rules and `@ApiProperty` decorators.
*   `repository/`: Standardized database access queries using Prisma. Contains no business logic.
*   `guards/`: Route-level access control specific to the module (e.g., verifying project ownership or accepted bid engagement).
*   `strategies/`: Passport strategies (e.g., Supabase JWKS verification).
*   `listeners/`: Event listeners responding to domain events asynchronously (e.g., notifications).

---

## 3. Database Schema Overview

The database models are configured in `prisma/schema.prisma`. Below is a summary of the core models and their relationships:

| Model | Description | Relations / Keys |
| :--- | :--- | :--- |
| **`User`** | Primary auth record. Stores email, Supabase Auth UUID (`supabaseId`), and role. | Linked to `ClientProfile`, `DeveloperProfile`, `Bid`, `Message`, `Notification`, `AuditLog`, `DisputeReport` |
| **`ClientProfile`** | Business profile details for Client users. | Belongs to `User`, has many `Project`s |
| **`DeveloperProfile`** | Professional profile details for Developer users. | Belongs to `User` |
| **`Project`** | Represents a system build request (CRM or POS). | Created by `ClientProfile`, has many `Bid`s |
| **`Bid`** | A developer's proposal for a project. | Belongs to `Project` and `User` (Developer), has many `Milestone`s, `Message`s, `LedgerEntry`s, `DisputeReport`s |
| **`Milestone`** | A discrete phase of project delivery. | Belongs to `Bid`, has many `LedgerEntry`s |
| **`Message`** | An instant message exchanged between matched users. | Belongs to `Bid` (chat room thread) and `User` (Sender) |
| **`LedgerEntry`** | Financial tracking of deposits, commissions, payouts, and refunds. | Belongs to `Bid` and `Milestone` |
| **`Notification`** | System alerts sent to users regarding status changes. | Belongs to `User` |
| **`DisputeReport`** | Grievances raised on a bid by clients or developers. | Belongs to `Bid`, `User` (Raiser, Against, ResolvedBy) |
| **`AuditLog`** | Immutable log of administrative interventions and changes. | Belongs to `User` (Admin) |
| **`PlatformSetting`** | Key-value store for runtime configuration (e.g. `commission_rate`). | Unique `key` |

---

## 4. API Route Reference

All endpoints are hosted at the root (`http://localhost:3000` or production host). Swagger documentation is auto-generated and interactive at `/api/docs`.

### Authentication Required (`@UseGuards(JwtAuthGuard)`)
All protected routes require an `Authorization` header containing a valid Supabase JWT Bearer token:
`Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>`

---

### 4.1 Health Check Module

#### `GET /health`
*   **Access**: Public (No Auth required)
*   **Guard**: None
*   **Controller**: `HealthController`
*   **Response**: `{ "status": "ok" }`

---

### 4.2 Authentication Module

Authentication is handled client-side via the **Supabase Auth client SDK**. The backend does not expose custom sign-up or sign-in password endpoints, but rather verifies Supabase-issued JWTs against Supabase's public JWKS endpoint (`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`).

#### Authentication Flow

1. **Sign up / Sign in (Frontend)**:
   * **Email & Password**: The client calls `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()`.
   * **Google OAuth**: The client calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.
   * Both methods return a Supabase session containing a JWT access token.

2. **Complete Registration (Backend Sync)**:
   * After the very first sign-up on Supabase, the frontend calls:
   * **`POST /auth/complete-registration`**
   * **Headers**: `Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>`
   * **Request Body (`CompleteRegistrationDto`)**:
     ```json
     {
       "role": "CLIENT" // or "DEVELOPER"
     }
     ```
   * **Guard**: `SupabaseVerifiedGuard` (verifies the Supabase JWT cryptographically via JWKS without requiring a local database row beforehand).
   * **Response**: `UserResponseDto` (local user profile with role).
   * *Note: `ADMIN` and `SUPER_ADMIN` cannot be self-assigned.*

3. **All Subsequent API Requests**:
   * The frontend attaches the Supabase JWT as a Bearer token.
   * The backend `JwtStrategy` validates the token against Supabase JWKS, resolves the local `User` record by `supabaseId`, and checks that the account is not `SUSPENDED` or `BANNED`.

> [!NOTE]
> **Removed Endpoints**: `POST /auth/sign-up` and `POST /auth/sign-in` from earlier scaffolds no longer exist. Authentication is strictly delegated to Supabase Auth.

---

### 4.3 Users & Profiles Module

Manages profile creation and lookup. User profile lookups (`findBySupabaseId`) are cached in Redis with a 60-second TTL.

#### `GET /users/me`
*   **Access**: Authenticated
*   **Response**: Current authenticated user object with client/developer profile details.

#### `POST /users/me/client-profile`
*   **Access**: Authenticated `CLIENT`
*   **Request Body (`CreateClientProfileDto`)**:
    ```json
    {
      "businessName": "Jaza Retailers Ltd",
      "businessType": "Retail",
      "phone": "+254712345678"
    }
    ```

#### `PATCH /users/me/client-profile`
*   **Access**: Authenticated `CLIENT`
*   **Request Body (`UpdateClientProfileDto`)**: Partial fields of client profile.

#### `POST /users/me/developer-profile`
*   **Access**: Authenticated `DEVELOPER`
*   **Request Body (`CreateDeveloperProfileDto`)**:
    ```json
    {
      "displayName": "Jane Wanjiru",
      "bio": "Full-stack developer with 4 years experience.",
      "techStack": ["React", "NestJS", "PostgreSQL"],
      "portfolioUrl": "https://janewanjiru.dev"
    }
    ```

#### `PATCH /users/me/developer-profile`
*   **Access**: Authenticated `DEVELOPER`
*   **Request Body (`UpdateDeveloperProfileDto`)**: Partial fields of developer profile.

#### `GET /users/:userId`
*   **Access**: Authenticated (User must own the profile or be an admin)

---

### 4.4 Projects Module

Allows clients to manage project briefs and developers to search for open opportunities.

#### `POST /projects`
*   **Access**: Authenticated `CLIENT`
*   **Request Body (`CreateProjectDto`)**:
    ```json
    {
      "title": "Supermarket POS System",
      "description": "Custom Point-of-Sale with M-Pesa STK push and offline inventory sync.",
      "systemType": "POS",
      "budgetMin": 50000,
      "budgetMax": 120000
    }
    ```
*   **Response**: Created project brief in `DRAFT` status.

#### `GET /projects`
*   **Access**: Authenticated
*   **Query Parameters (`ProjectFilterDto`)**: `systemType`, `status` (defaults to `OPEN`), `search`, `budgetMin`, `budgetMax`, `page`, `pageSize`.
*   **Response**: Paginated list of projects.

#### `GET /projects/:id`
*   **Access**: Authenticated (Drafts visible only to owner; open projects visible to all).

#### `PATCH /projects/:id`
*   **Access**: Authenticated `CLIENT` (Owner only; allowed while `DRAFT` or `OPEN`).

#### `POST /projects/:id/publish`
*   **Access**: Authenticated `CLIENT` (Owner only; transitions status to `OPEN`).

#### `POST /projects/:id/cancel`
*   **Access**: Authenticated `CLIENT` (Owner only; transitions status to `CANCELLED`).

---

### 4.5 Bids Module

Allows verified developers to submit proposals and clients to accept bids.

#### `POST /bids`
*   **Access**: Authenticated `DEVELOPER` (Requires `verificationStatus === 'APPROVED'`)
*   **Request Body (`CreateBidDto`)**:
    ```json
    {
      "projectId": "project-uuid-here",
      "proposedAmount": 75000,
      "message": "I have previously built POS systems with offline caching."
    }
    ```

#### `GET /bids/mine`
*   **Access**: Authenticated `DEVELOPER` (Returns all bids placed by the developer).

#### `GET /bids/project/:projectId`
*   **Access**: Authenticated `CLIENT` (Owner of the project only).

#### `POST /bids/:id/accept`
*   **Access**: Authenticated `CLIENT` (Owner of the project only).
*   **Effect**: Atomically updates bid to `ACCEPTED`, other pending bids on the project to `REJECTED`, and project status to `MATCHED`. Emits `bid.accepted` domain event.

#### `POST /bids/:id/decline`
*   **Access**: Authenticated `CLIENT` (Owner of the project only).

---

### 4.6 Messages (Realtime Chat) Module

Direct communication between matched clients and developers.

#### REST Endpoints
*   `POST /messages`: Send a message in an accepted engagement (`SendMessageDto`: `{ "bidId": "...", "content": "..." }`).
*   `GET /messages/bid/:bidId`: Fetch message history for an accepted engagement.

#### WebSockets Realtime API (Socket.io)
*   **Protocol**: `ws://` or `wss://`
*   **Handshake Authentication**: Provide Supabase JWT via `auth.token` or query param `?token=<JWT>`. The gateway resolves the local `User.id` and validates account status.
*   **Client Emit `joinRoom`**: `{ "bidId": "<bid-uuid>" }` — Joins the engagement chat room if the user is the developer or client.
*   **Client Emit `sendMessage`**: `{ "bidId": "<bid-uuid>", "content": "Hello!" }` — Persists to DB and broadcasts to room.
*   **Server Emit `message`**: Broadcasts the saved message payload to room participants.

---

### 4.7 Milestones Module

Manages project deliverables and progression.

#### `POST /milestones`
*   **Access**: Authenticated
*   **Request Body (`CreateMilestoneDto`)**:
    ```json
    {
      "bidId": "bid-uuid",
      "title": "Phase 1: Architecture & UI Prototype",
      "description": "Wireframes, schema design, and core layout.",
      "amount": 30000,
      "dueDate": "2026-10-01T00:00:00.000Z"
    }
    ```

#### `GET /milestones/bid/:bidId`
*   **Access**: Authenticated (Returns milestones for the bid).

#### `PATCH /milestones/:id/status`
*   **Access**: Authenticated (Engagement participants only).
*   **Request Body (`UpdateMilestoneStatusDto`)**: `{ "status": "SUBMITTED" }`
*   **State Machine Transitions**:
    *   `PENDING` $\rightarrow$ `IN_PROGRESS`
    *   `IN_PROGRESS` $\rightarrow$ `SUBMITTED` *(Emits `milestone.submitted`)*
    *   `SUBMITTED` $\rightarrow$ `APPROVED` *(Emits `milestone.approved`)* or `IN_PROGRESS` (revisions)
    *   `APPROVED` $\rightarrow$ `PAID` *(Upon payout confirmation)*

---

### 4.8 Payments Module

Manages platform escrow ledger entries.

#### `POST /payments/initiate`
*   **Access**: Authenticated `CLIENT`
*   **Request Body (`InitiatePaymentDto`)**: `{ "bidId": "...", "amount": 30000 }`
*   **Effect**: Creates a `HELD` ledger entry with `PENDING` status.

#### `POST /payments/confirm-payout`
*   **Access**: Authenticated `ADMIN` or `SUPER_ADMIN`
*   **Request Body (`PayoutConfirmationDto`)**: `{ "milestoneId": "..." }`
*   **Effect**: In a single atomic `$transaction`:
    1. Computes platform commission from platform settings (`commission_rate`).
    2. Creates a `COMMISSION` ledger entry with idempotency key.
    3. Creates a `PAYOUT` ledger entry for the developer.
    4. Updates milestone status to `PAID`.
    5. Emits `payout.completed` domain event.

#### `GET /payments/bid/:bidId`
*   **Access**: Authenticated (Returns ledger history for the engagement).

---

### 4.9 Admin Module

Comprehensive governance operations for `ADMIN` and `SUPER_ADMIN`.

#### User Management & Moderation
*   `GET /admin/users`: Search and filter users by role, status, email, or business name.
*   `GET /admin/users/:id`: View full user and profile details.
*   `PATCH /admin/users/:id/status` (`SUPER_ADMIN`): Adjust status (`ACTIVE`, `SUSPENDED`, `BANNED`).
*   `POST /admin/verify-developer`: Approve or reject developer profiles with required reason.
*   `POST /admin/moderate-listing`: Set project status to `OPEN` (approve) or `REMOVED`.

#### Disputes
*   `POST /admin/disputes`: Raise a dispute against an engagement.
*   `GET /admin/disputes`: List all dispute tickets.
*   `GET /admin/disputes/:id`: View dispute ticket details and engagement context.
*   `PATCH /admin/disputes/:id`: Resolve dispute (`RESOLVED` or `REJECTED`) with resolution notes.

#### Financials & Platform Settings (`SUPER_ADMIN`)
*   `POST /admin/promote`: Promote or demote user roles.
*   `GET /admin/financial-report`: View aggregated totals grouped by ledger type and status.
*   `GET /admin/settings/fee`: View current commission rate.
*   `PATCH /admin/settings/fee`: Update commission rate.
*   `GET /admin/audit-logs`: View immutable audit trails of all administrative actions.

---

### 4.10 Notifications Module

*   `GET /notifications`: Retrieve the authenticated user's notification list.

---

## 5. Domain Events & Asynchronous Communication

Cross-module communication is decoupled using NestJS **`EventEmitter2`**. Events are emitted **only after the underlying database transactions commit**.

```mermaid
graph TD
    Bids[BidsService.accept] -->|Emits| E1[EVENTS.BID_ACCEPTED]
    Milestones1[MilestonesService -> SUBMITTED] -->|Emits| E2[EVENTS.MILESTONE_SUBMITTED]
    Milestones2[MilestonesService -> APPROVED] -->|Emits| E3[EVENTS.MILESTONE_APPROVED]
    Payments[PaymentsService.confirmPayout] -->|Emits| E4[EVENTS.PAYOUT_COMPLETED]
    
    E1 --> Listener[NotificationsListener]
    E2 --> Listener
    E3 --> Listener
    E4 --> Listener
    
    Listener -->|Safe Notify| DB[(Notification Table)]
```

### Event Registry (`src/common/events/`)

| Event Constant | Payload Class | Trigger | Target Recipient |
| :--- | :--- | :--- | :--- |
| `EVENTS.BID_ACCEPTED` | `BidAcceptedEvent` | Client accepts developer's bid | Developer |
| `EVENTS.MILESTONE_SUBMITTED` | `MilestoneSubmittedEvent` | Developer submits milestone work | Client |
| `EVENTS.MILESTONE_APPROVED` | `MilestoneApprovedEvent` | Client approves milestone deliverables | Developer |
| `EVENTS.PAYOUT_COMPLETED` | `PayoutCompletedEvent` | Admin confirms milestone disbursal | Developer |

---

## 6. Deployment & Hosting (Render PaaS)

The **PataDev Ke** backend requires long-lived bidirectional TCP connections for **Socket.io WebSockets** and persistent **Redis connection pooling**. It is configured for deployment on **Render** (as a Web Service) or any containerized PaaS (Fly.io, Railway, AWS ECS).

```mermaid
graph LR
    subgraph Render Web Service
        API[NestJS API Server :3000]
        WS[Socket.io Gateway]
        Events[EventEmitter2 Engine]
    end
    
    subgraph Supabase Cloud
        PG[(PostgreSQL Database)]
        Auth[Supabase Auth IdP]
        Storage[Supabase Storage]
    end
    
    subgraph Redis Provider
        Cache[(Upstash / Redis Cloud)]
    end
    
    API -->|Prisma Pg Adapter| PG
    API -->|JWKS Key Retrieval| Auth
    API -->|User Cache| Cache
```

### Render Deployment Configuration

1. **Environment**: Node.js
2. **Build Command**:
   ```bash
   npm install && npm run prisma:generate && npm run build
   ```
3. **Start Command**:
   ```bash
   npm run start:prod
   ```
4. **Health Check Path**: `/health`

### Required Environment Variables

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase Auth JWKS Verification
SUPABASE_URL="https://[ref].supabase.co"

# Redis Cache (Upstash Redis or Redis Cloud)
REDIS_URL="redis://default:[password]@[host]:[port]"

# App Configuration
PORT=3000
NODE_ENV=production
```

---

## 7. End-to-End Workflow Guide

```mermaid
sequenceDiagram
    autonumber
    actor Client
    actor Dev
    actor Admin
    participant Supabase as Supabase Auth
    participant API as PataDev Ke Backend

    Note over Client,Dev: 1. Onboarding & Registration
    Client->>Supabase: signUp / signInWithOAuth(google)
    Supabase-->>Client: Returns JWT Token
    Client->>API: POST /auth/complete-registration (role: CLIENT)
    Client->>API: POST /users/me/client-profile (businessName, etc.)

    Dev->>Supabase: signUp / signInWithOAuth(google)
    Supabase-->>Dev: Returns JWT Token
    Dev->>API: POST /auth/complete-registration (role: DEVELOPER)
    Dev->>API: POST /users/me/developer-profile (techStack, bio)

    Admin->>API: POST /admin/verify-developer (Approves Developer Profile)

    Note over Client,Dev: 2. Project Posting & Bidding
    Client->>API: POST /projects (Creates DRAFT Project)
    Client->>API: POST /projects/:id/publish (Transitions to OPEN)

    Dev->>API: GET /projects (Browses open projects)
    Dev->>API: POST /bids (Submits proposal with proposedAmount)

    Client->>API: GET /bids/project/:projectId (Reviews bids)
    Client->>API: POST /bids/:id/accept (Status -> MATCHED; Emits bid.accepted)
    API-->>Dev: In-App Notification: "Your bid was accepted."

    Note over Client,Dev: 3. Collaboration & Milestones
    Client->>API: Connect WebSocket ws://host (Join Room bidId)
    Dev->>API: Connect WebSocket ws://host (Join Room bidId)
    Client->>API: WS sendMessage (Realtime chat)

    Client->>API: POST /milestones (Creates project deliverables)
    Client->>API: POST /payments/initiate (Funds escrow for milestone)

    Dev->>API: PATCH /milestones/:id/status (IN_PROGRESS -> SUBMITTED)
    API-->>Client: In-App Notification: "A milestone was submitted for review."

    Client->>API: PATCH /milestones/:id/status (SUBMITTED -> APPROVED)
    API-->>Dev: In-App Notification: "Your milestone was approved."

    Note over Admin: 4. Escrow Disbursal
    Admin->>API: POST /payments/confirm-payout (Processes ledger payout & commission)
    API-->>Dev: In-App Notification: "Payout was processed."
```
