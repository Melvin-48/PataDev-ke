# Messaging Module Requirements & Codebase Review

This document contains the codebase review for the **Messaging (Chat) Module** of **PataDev Ke**, identifying critical bugs, architectural gaps, and necessary enhancements to prepare it for production software.

---

## 1. Current State Assessment

The messaging module is located under [src/modules/messages/](file:///home/lawrence/Projects/attach/PataDev-ke/src/modules/messages/). Here is the breakdown of its structure:

*   **Database Schema (`schema.prisma`)**:
    *   Contains the `Message` model linked to `Bid` (acting as the thread) and `User` (the sender).
*   **Controller Endpoints**:
    *   `POST /messages`: Authenticated user sends a chat message.
    *   `GET /messages/bid/:bidId`: Retrieves chronological chat history.
    *   `BidAcceptedGuard` restricts HTTP operations strictly to users who are the Client or Developer of an accepted project bid.
*   **Realtime Gateway (`messages.gateway.ts`)**:
    *   Implements `MessagesGateway` using `socket.io` for bi-directional WebSocket communication.
    *   Authenticates connections on handshake by verifying Supabase JWTs using JWKS.
    *   Listens to events: `joinRoom` (joins a chat thread) and `sendMessage` (broadcasts realtime messages).

---

## 2. Critical Bugs & Gaps Identified

We found two critical implementation bugs and several design gaps that will prevent the messaging system from functioning in production:

### A. Critical Bug: User ID Mismatch in WebSocket Gateway
*   **The Issue**: 
    1. In `messages.gateway.ts`, the authenticated user is resolved directly from the JWT:
       ```typescript
       (client as any).user = {
         id: decoded.sub, // decoded.sub is the Supabase UUID!
         ...
       };
       ```
    2. However, the database tables (`Bid.developerId`, `ClientProfile.userId`, and `Message.senderId`) all reference our local application `User.id` (the local internal UUID). The Supabase UUID is stored in a separate column (`User.supabaseId`).
    3. In `validateBidAccess()`, the gateway compares the local `User.id` (from the DB) directly with `client.user.id` (which contains the Supabase UUID):
       ```typescript
       const isDeveloper = bid.developerId === userId; // Compares local User.id with Supabase UUID
       const isClient = bid.project.client.userId === userId; // Compares local User.id with Supabase UUID
       ```
    4. Since these are two entirely different UUIDs, this comparison will **always fail**. WebSocket clients will never pass the authorization check, and `joinRoom` / `sendMessage` will always return `Unauthorized`.
    5. Furthermore, when trying to persist the message, `messagesService.send(user.id, ...)` uses the Supabase UUID. This will trigger a foreign key constraint violation because `senderId` in the `Message` table must match a local `User.id`.
*   **The Fix**:
    The gateway must resolve the local `User.id` using the Supabase UUID (`decoded.sub`). This should be done once in `handleConnection` and attached to the socket instance:
    ```typescript
    const user = await this.prisma.user.findUnique({ where: { supabaseId: decoded.sub } });
    (client as any).user = {
      localUserId: user.id, // Use this for database and authorization checks
      id: user.id,
      email: decoded.email,
    };
    ```

### B. Critical Bug: Import-Time Environment Variable Initialization
*   **The Issue**:
    In `messages.gateway.ts`, `JwksClient` is initialized as a global file-level constant:
    ```typescript
    const jwks = new JwksClient({
      jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
      ...
    });
    ```
    Because NestJS loads configurations asynchronously via `ConfigModule` inside `AppModule` during bootstrap, `process.env.SUPABASE_URL` is undefined when the file is statically imported. This results in an invalid `jwksUri` (`undefined/auth/v1/.well-known/jwks.json`), which will break JWT signature verification on the handshake.
*   **The Fix**:
    Inject NestJS `ConfigService` into `MessagesGateway` and construct the `JwksClient` inside the class constructor or lazily inside `verifyToken`:
    ```typescript
    private jwksClient: JwksClient;

    constructor(
      private readonly config: ConfigService,
      ...
    ) {
      this.jwksClient = new JwksClient({
        jwksUri: `${this.config.getOrThrow('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
      });
    }
    ```

### C. Missing Message Pagination (Performance Risk)
*   **The Issue**:
    `MessagesRepository.findByBid` performs a simple `findMany` fetching the entire history. As project chats accumulate hundreds of messages, this route will cause severe memory and network load.
*   **The Fix**:
    Introduce pagination using a cursor-based approach (ideal for chat apps to avoid duplicate messages on new updates) or standard offset pagination (`page`, `pageSize`, `beforeMessageId`).

### D. Lack of Message Validation & Sanitization
*   **The Issue**:
    `SendMessageDto` only validates that `content` is a string. It does not prevent empty strings, white-space-only messages, or excessively large payloads.
*   **The Fix**:
    Apply class-sanitizers to trim input and restrict message sizes (e.g., maximum 2000 characters) to prevent spam and database bloat:
    ```typescript
    @IsString()
    @IsNotEmpty()
    @Length(1, 2000)
    content: string;
    ```

### E. No Read Receipts or Delivery Status
*   **The Issue**:
    The database schema does not have a status/timestamp for tracking if messages are read, which is a standard feature for real-time collaboration.
*   **The Fix**:
    Add a `read` boolean or `readAt` timestamp to the `Message` model and expose a controller/gateway hook (`POST /messages/:id/read`) to mark messages as read.

### F. Decoupled Notifications for Offline Users
*   **The Issue**:
    If a client sends a message and the developer is offline (not connected to the socket), the developer will miss the message until they manually log in.
*   **The Fix**:
    Emit a NestJS event `message.sent` inside `MessagesService`. Let `NotificationsModule` listen to this event, check if the recipient is online (e.g., querying active Redis socket mappings), and generate a system notification or email alert if they are offline.

---

## 3. Proposed Refactored Architecture

To align with standard, boring, and highly maintainable systems:

1.  **Strict Token and Config Parsing**:
    Move all token validation, JWKS caching, and key-fetching logic out of the gateway file-level scopes and encapsulate them inside an `AuthGatewayGuard` or within the gateway constructor.
2.  **DTO Enforcements**:
    Strictly define socket payload models using `class-validator` so they can be piped and validated on entry.
3.  **Active Connections Registry**:
    Maintain a lightweight registry in Redis or the memory server to track which local user IDs are currently active on which sockets. This allows correct routing of offline notifications.
