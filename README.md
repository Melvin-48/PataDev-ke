# PataDev Ke - Backend

NestJS API for the PataDev Ke Developer-Customer/Businesses Platform.
Connects developers with businesses (CRM/POS builds), handling matching, milestones,
messaging, and payment intermediation.

## Stack
- **Framework:** NestJS
- **DB/Auth/Storage:** Supabase (PostgreSQL), accessed via Prisma
- **Docs:** Swagger, auto-generated at `/api/docs`

## Getting started
```bash
npm install
cp .env.example .env      # fill in Supabase + DB credentials
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```
API runs at `http://localhost:3000`, Swagger docs at `http://localhost:3000/api/docs`.

## Module ownership (current split)
| Module | Owner |
|---|---|
| Auth, Users, Payments | Dev A |
| Projects, Bids, Milestones | Dev B |
| CI/CD, environments, deployment, cross-module review | Team lead |
| Messages, Notifications | Whoever owns the surrounding screen (frontend-paired) |
| Admin | Shared |

## Module dependency order
Auth -> Users -> Projects -> Bids -> Messages (gated on Bid.status === 'accepted') -> Milestones -> Payments

Build in this order. Payments is last: it depends on Milestones existing and is the
highest-risk module (platform acts as payment intermediary - see payments/README notes
in code comments).

## Folder pattern
Every module under `src/modules/<name>/` follows the same internal layout:
```
controller/   HTTP layer, route decorators, Swagger tags
service/      business logic
dto/          request/response shapes, validated + documented for Swagger
repository/   Prisma queries (data access only, no business logic)
guards/       route-level access control specific to this module
strategies/   (auth module only) Passport strategies
helpers/      pure functions supporting the service (status transitions, calculations)
```
Copy the `auth/` module structure as the template for any new module.

## Environments
Use separate Supabase projects for dev / staging / production. Never point local
development at the staging or production database.
