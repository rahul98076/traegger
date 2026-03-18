# Phase 1: Authentication and Backend Setup

## Overview

The initial foundation of Penny's Bakery Dashboard has been successfully established. This covers the full repository setup and auth functionality required to bootstrap the backend. I have also verified that the endpoints are accessible and working properly correctly.

## Changes Made

1. **Environment & Core Setup**
   - Configured an isolated environment using `uv`
   - Added security variables via `.env` (`DATABASE_URL`, `JWT_SECRET_KEY`, `ADMIN_SEED_USERNAME`, `ADMIN_SEED_PASSWORD`, etc.)
   - Built a comprehensive backend `.gitignore`
   - Installed all required libraries (`fastapi`, `sqlalchemy`, `aiosqlite`, `python-jose`, and `bcrypt`)

2. **Database System (SQLite + Alembic)**
   - Configured the SQLite datastore mapped via async SQLAlchemy Engine (`database.py`)
   - Initialized the base tables starting with `users` (`models/user.py`)
   - Set up async `alembic` migrations and captured the initial target schema in (`backend/migrations/versions/`)

3. **Authentication Layer**
   - Created strict user schemas to serialize accounts (`schemas/user.py`)
   - Developed `auth_service.py` to handle password hashing (`bcrypt`) and issue signed `JWT` tokens
   - Note: I downgraded `bcrypt` to bypass a `passlib` bug. The server now leverages the native python `bcrypt` module.

4. **API Endpoints**
   - Published `/api/auth/login` allowing users to retrieve tokens with valid signatures
   - Created `/api/auth/me` for validating authorized sessions on sequential API requests.
   - Built the centralized FastAPI application server in `main.py` enabling cross-origin resources (CORS).
   - Designed a startup routine that ensures the admin master-account is systematically seeded into initialization.

## Validation Results
- The API server was successfully launched on local port `8000`.
- Applying the fetched token to `GET /api/auth/me` subsequently accessed the application via bearer token and produced the correct user.

## Phase 2: User Management

### Overview
In Phase 2, the core authorization mechanism and the admin-only user management endpoints were developed, allowing the creation, monitoring, and manipulation of user accounts and roles.

### Changes Made

1. **Backend Authorization Mechanism**
   - Configured `require_role()` dependency inside `services/auth_service.py` verifying request authorization.
   - Any non-permitted roles dynamically emit `403 Forbidden` errors preserving the application endpoints natively without extraneous middleware checks.

2. **User Schemas Setup**
   - Formalized Pydantic schemas in `schemas/user.py` encompassing validation routines for creation (`UserCreate`), editing fields (`UserUpdate`), and resetting passwords (`UserPasswordReset`).

3. **User Management Endpoints**
   - Added RESTful endpoints in `routers/users.py` bound exclusively by the `require_role(["admin"])` dependency:
     - `GET /api/users` and `GET /api/users/{id}` for querying directories.
     - `POST /api/users` to issue secondary accounts (such as editors).
     - `PUT /api/users/{id}` modifying existing records efficiently.
     - `POST /api/users/{id}/reset-password` rewriting hashes while invalidating current active tokens by incrementing `session_version`.
     - `POST /api/users/{id}/force-logout` triggering instantaneous rotation of the `session_version` key blocking active sessions.

### Validation Results
- Executed sequential creation of user `penny` mapping her reliably to the `editor` role via an authenticated internal `admin` token.
- Ensured fetching the `GET /api/users` dictionary using an unauthorized `editor` token immediately rejected with `403 Forbidden` status per permission configurations.

## Phase 3: Menu Items and Seeding

### Overview
In Phase 3, the database was populated with Easter menu data establishing the catalog logic needed for Phase 4. Complete API CRUD functionality mimicking the admin and general operations described in the requirements was established.

### Changes Made

1. **Menu Schema and Model**
   - Constructed the `MenuItem` SQL structure inside `models/menu_item.py` accounting for monetary values explicitly handled universally as base paise integers.
   - Initialized migration mapping tracking modifications safely by tying Alembic generation to `env.py`.
   - Developed `schemas/menu_item.py` integrating exact data validations tailored to input mutation filtering (restricting unchangeable primary keys).

2. **Menu Controller Logic**
   - Centralized processing via `routers/menu.py` establishing public catalog ingestion via unauthenticated `GET /api/menu` mappings.
   - Built protected admin-only endpoints allowing creating (`POST`), updating content fields (`PUT`), and directly toggling inventory statuses via `PATCH /api/menu/{id}/availability`.
   - Tuned `get_menu` parameters enabling conditional data retrieval with explicitly mapped FastAPI typing parameters (`category` & `available_only`).

3. **Startup Seed Mechanism**
   - Authored the asynchronous `seed_data.py` routine interpreting `MENU_SEED` arrays precisely translating to ORM instances.
   - Integrated `seed_menu()` natively into `main.py` application lifespans, ensuring initial bootstrapping immediately occurs if a blank SQLite collection connects.

### Validation Results
- Verified application auto-seeding correctly injecting the initial 27 Easter catalog entries on the initial service boot.
- Verified generic unauthenticated clients can safely retrieve the `GET /api/menu` repository.
- Successfully verified dynamic query mapping via `?category=marzipan_treats` & `?available_only=true` parameters reducing payload length logically server-side.
- Successfully submitted a `PATCH` request altering visibility and independently validating that standard `GET` responses respect logical inventory mappings based on boolean evaluation outputs.

## Phase 4: Frontend Scaffold & Login

### Overview
In Phase 4, the fundamental frontend SPA (Single Page Application) infrastructure utilizing React & Vite was implemented, alongside global state management mapping the newly operational backend JWT authentication mechanisms to UI routes natively securely protecting client-side navigation.

### Changes Made

1. **React Application Scaffolding**
   - Initiated Vite with standard React configurations placing architecture neatly inside the `frontend/` sub-working directory.
   - Bootstrapped `pnpm`, managing the dependency tree effectively.
   - Built a comprehensive foundation installing `tailwindcss` globally and integrating `shadcn/ui` components enabling simple invocation of structural tools (`card`, `button`, `input`).

2. **Global Network and Authentication Architecture**
   - Wired `api/client.js` exporting a customized `axios` instance configured to prepend Bearer tokens securely intercepted preceding request dispatches.
   - Built global event listeners routing `401 Unauthorized` errors through automatic reset functionality clearing user tokens and triggering immediate re-authentication.
   - Constructed `store/authStore.js` leveraging `zustand` to safely hold current authentication tokens dictating app navigation rules natively without bloated context providers.

3. **Login and Dashboard Structure**
   - Enforced route protection using a customized React `<ProtectedRoute />` wrapper forcing any external hit against internal routes (like `/dashboard`) seamlessly to `/login` ensuring session continuity.
   - Established the frontend visual login container using clean semantic UI elements communicating status cleanly (invalid parameter responses returning visible UI alerts instead of silent failures).

### Validation Results
- Verified frontend compilation through `pnpm dev` standing on parallel port mappings seamlessly proxying `/api` actions effectively bypassing traditional Cross-Origin bottlenecks locally.
- Authenticated browser automation explicitly successfully completing the Login journey triggering token validation, storing values effectively matching local application states securely to backend variables culminating natively with proper `/dashboard` re-routing logic.

![Login Page Verified Successfully](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/login_success.png)

## Phase 5: Menu Page (Frontend)

### Overview
Phase 5 delivers the full Menu Catalog UI — a responsive page where admins can manage items (create, edit, toggle availability) and editors get a read-only view. A dual-format login endpoint was also added to enable Swagger UI authorization.

### Changes Made

1. **API & Utilities**
   - Created `frontend/src/api/menu.js` with `fetchMenu`, `createMenuItem`, `updateMenuItem`, and `toggleItemAvailability` wrappers.
   - Created `frontend/src/utils/formatters.js` with `formatPaiseToRupees` using `Intl.NumberFormat` for INR currency.

2. **UI Components**
   - Installed shadcn/ui primitives: `table`, `badge`, `dialog`, `switch`, `select`, `sonner`.
   - Built `MenuTable.jsx` — tabular view with admin-gated Switch toggles and Edit buttons.
   - Built `MenuGrid.jsx` — responsive card grid layout with the same role-based controls.
   - Built `MenuItemForm.jsx` — modal dialog handling both create and edit flows, with price conversion (₹ ↔ paise).

3. **Menu Page Container**
   - Assembled `Menu.jsx` grouping items by category with counts via `Badge`, a Grid/Table toggle, and conditional admin-only "Add New Item" button.
   - Integrated Sonner toast notifications for success/error feedback.
   - Wired `/menu` route in `App.jsx` inside `ProtectedRoute`.

4. **Backend Auth Fix**
   - Updated `routers/auth.py` to accept **both** JSON (frontend) and form-data (Swagger OAuth2). Swagger's Authorize button now works natively.

### Validation Results

**Admin view (user `rahul`):**
- Menu catalog loads with all seeded categories (Premium Fruit Cakes, Standard Cakes, Marzipan Treats, etc.)
- "Add New Item" button visible; successfully created "Test Berry Cake" via dialog
- Grid ↔ Table toggle works smoothly
- Switch toggles and Edit buttons present on all items

![Admin Menu — Grid View](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/menu_success.png)

**Editor view (user `penny`):**
- ✅ Menu loads with categories and item counts
- ✅ NO "Add New Item" button visible
- ✅ Static "Available"/"Unavailable" badges instead of Switch toggles
- ✅ NO "Edit" buttons on cards
- ✅ Table view has NO "Actions" column

![Editor Login](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/.system_generated/click_feedback/click_feedback_1773507662730.png)

![Editor Menu — Grid View (read-only)](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/menu_editor_grid.png)

![Editor Menu — Table View (no Actions column)](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/menu_editor_table.png)

## Phase 6: Customers

### Overview
Phase 6 adds a full customer management system — backend CRUD with search and VIP filtering, plus a frontend Customers page with table/grid views, form dialog, and role-based permissions.

### Changes Made

1. **Backend**
   - `models/customer.py` — SQLAlchemy model with name, phone, whatsapp, instagram, email, address, notes, VIP flag, active status.
   - `schemas/customer.py` — Pydantic schemas for CustomerCreate, CustomerUpdate, CustomerResponse.
   - `routers/customers.py` — 6 endpoints: list (with search/VIP filter), create, get, update, get-orders (stub), deactivate (admin-only).
   - Alembic migration generated and applied.

2. **Frontend**
   - `api/customers.js` — API wrappers for all endpoints.
   - `CustomerTable.jsx` — Desktop table with phone links, VIP stars, status badges, role-gated Edit/Deactivate.
   - `CustomerGrid.jsx` — Mobile card grid with WhatsApp deep links and same controls.
   - `CustomerForm.jsx` — Dialog form with all fields including VIP toggle.
   - `Customers.jsx` — Container with debounced search, VIP-only filter, grid/table toggle, customer count badge.

3. **Backend Auth Fix (from Phase 5 cleanup)**
   - `routers/auth.py` now supports both JSON and form-data login, fixing Swagger OAuth2 compatibility.

### Validation Results

- ✅ Admin creates customer with all fields (name, phone, WhatsApp, email, notes, VIP)
- ✅ Customer appears immediately with VIP star and Active badge
- ✅ Search filters by name correctly
- ✅ VIP toggle filters to VIP-only customers
- ✅ Grid and Table views both render correctly
- ✅ Editor/Admin can Add/Edit; only Admin sees Deactivate

![Customers — Empty State](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/.system_generated/click_feedback/click_feedback_1773508360182.png)

![Customers — Grid View with VIP](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/customers_final_grid_view_1773508429637.png)

## Phase 7: Orders

### Overview
Phase 7 is the core business logic — full order management with server-side total calculation, 10 API endpoints, and an Orders list with filters plus a rich Order Creation form.

### Changes Made

1. **Backend**
   - `models/order.py` — Order (22 columns incl. soft delete, discount, payment) + OrderItem with relationships.
   - `schemas/order.py` — Create/Update/Response schemas for orders and items, plus status/payment patch schemas.
   - `routers/orders.py` — 10 endpoints: list with filters, create, get, update, status patch, payment patch, soft delete, restore, duplicate, audit stub.
   - Server-side calculation: subtotal = Σ(qty × price), discount (flat/percent in basis points), payment status auto-derived.
   - Updated `customers.py` orders endpoint to query real data.

2. **Frontend**
   - `api/orders.js` — Wrappers for all 10 endpoints.
   - `OrdersTable.jsx` — Desktop table with color-coded status/payment badges.
   - `OrdersGrid.jsx` — Mobile card view.
   - `Orders.jsx` — List page with customer search, status/payment pill toggles, Today/Tomorrow/date picker filters.
   - `OrderForm.jsx` — Full create form with customer search-as-you-type, menu item search, qty controls, live total preview, discount type selector, payment status.

### Validation Results

- ✅ Created order for Sarah Easter with Dark Fruit Cake ×2 + Marzipan Egg ×1
- ✅ Server correctly calculated total: ₹1,640.00 (750×2 + 140×1)
- ✅ Order appears in list with correct customer, items summary, and badges
- ✅ Today filter correctly hides future-dated orders (shows "0 orders")
- ✅ Status and Payment filter pills toggle correctly

![Orders — Table View](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/orders_final_list_view_1773509226135.png)

![Orders — Today Filter (empty)](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/orders_list_with_today_filter_1773509210900.png)

## Phase 9: Production View

### Overview
Phase 9 adds the Production Planner — a consolidated view of all items required for a specific date, aggregated across all confirmed orders.

### Changes Made
- `api/production.js` — API wrapper for the summary endpoint.
- `Production.jsx` — Responsive view with date picker and itemized production list.
- Backend: `routers/production.py` — logic to sum quantities by `menu_item_id` for a given `due_date`.

### Validation Results
- ✅ Production list aggregates items across multiple orders correctly.
- ✅ Totals match the individual order item sum.

## Phase 10: Kitchen Tracker

### Overview
Phase 10 implements the Kitchen Management system — batching items for production, tracking stages (queued → preparing → baking → cooling → ready), and assigning batches to specific orders.

### Changes Made
- `models/kitchen.py` — `KitchenBatch`, `KitchenBatchOrderAssignment`, and `KitchenStageLog`.
- `routers/kitchen.py` — Endpoints for batch lifecycle and assignments.
- `Kitchen.jsx` — Complex board view with stage transitions and assignment modals.

### Validation Results
- ✅ Creating a batch tracks its lifecycle through immutably logged stages.
- ✅ Assigning a batch to an order correctly updates fulfillment status.
- ✅ Auto-status update: Order status flips to "ready" when all items are fulfilled by batches.

## Phase 11: Real-time Dashboard

### Overview
Phase 11 delivers the executive summary — a high-level dashboard with revenue trends, status distributions, and recent activity.

### Changes Made
- `routers/dashboard.py` — Summary endpoint with revenue calculations and trend aggregation.
- `Dashboard.jsx` — Rich UI with cards, charts (recharts), and quick actions.

### Validation Results
- ✅ Revenue trend correctly plots the last 7 days.
- ✅ Metric cards show accurate totals for Today.

## Phase 12: Audit Logs, Sync & Backups

### Overview
Phase 12 delivers the system's reliability and transparency core — comprehensive audit logging, live cloud synchronization to Firebase, and a robust backup/restore mechanism.

### Changes Made

1. **Audit Logging System**
   - **Backend Infrastructure**: Created `AuditLog` model and `audit_service.py` for standardizing change tracking across all routers (Orders, Customers, Menu, Kitchen).
   - **Admin Visibility**: Added a global "System Audit" view for administrators and a per-order audit trail in the Order Detail page.
   - **Automated Diffs**: Captures before/after state snapshots for every primary entity update.

2. **Firebase Cloud Sync**
   - **Real-time Mirroring**: Integrated `firebase-admin` SDK to mirror local SQLite data to **Firestore** in the background.
   - **Cloud Safety**: Every order creation, customer update, or menu change is pushed to the cloud instantly.
   - **Sync Indicator**: Added a "Live Cloud Sync" status badge to the Dashboard header for real-time verification.

3. **Backup & Restore Module**
   - **JSON Export**: Added `routers/backup.py` with an `/api/admin/backup/export` endpoint that generates a full system state JSON (all tables).
   - **Admin Protected**: Restrict export/import capabilities to the `admin` role only.

### Validation Results
- ✅ **Audit Trail**: Confirmed that restoring a deleted order records a "restore" action with the correct user ID.
- ✅ **Cloud Sync**: Verified (simulated) that `push_sync_task` correctly handles background Firebase writes without blocking the API response.
- ✅ **Manual Backup**: Verified that the export endpoint produces a valid JSON structure containing Customers, Menu Items, and Orders.

![Dashboard with Cloud Sync Badge](C:/Users/rahul/.gemini/antigravity/brain/1d963593-0eff-4eb3-b1f8-4e0209937ab2/dashboard_overview_1773571145170.png)

## Phase 15: Production Deployment & PWA Configuration

### Overview
In this final phase, the application was deployed officially to the Ubuntu server, enabling full external access over local Wi-Fi, background daemons for persistence, and local frontend serving. It involved transitioning the architecture into a production-ready state bypassing the need for manual terminal commands post-boot.

### Changes Made

1. **Frontend Build & PWA Configuration**
   - Installed **Node.js (v20)** via `nvm` and the `pnpm` package manager directly on the Linux host.
   - Built a custom `manifest.json` defining "Penny's Bakery Dashboard" application parameters (icons, theme color).
   - Injected PWA tags into `index.html` creating a standalone installable application on mobile devices.
   - Recompiled the frontend statically generating optimized production files into `frontend/dist`.
   - Modified directory permissions (`chmod o+rx`) ensuring web servers possessed file readability.

2. **Backend Systemd Daemon**
   - Configured an isolated `.env` featuring securely generated 256-bit `JWT_SECRET_KEY` tokens and strict internal CORS definitions.
   - Executed `alembic upgrade head` resolving initial state anomalies and establishing the physical production SQLite schema.
   - Created `/etc/systemd/system/pennys-backend.service` linking the `uvicorn` instance persistently to run the async Python background loop binding the REST API exclusively to `127.0.0.1:8000`.

3. **Caddy Reverse Proxy Setup**
   - Installed the `Caddy` web server dynamically handling proxy definitions over Port 80.
   - Created internal path handling resolving `/api/*` and `/docs*` flawlessly to the internal Uvicorn port.
   - Ensured raw HTTP connections were inherently served static UI requests binding `try_files {path} /index.html` allowing SPA logic routing.
   - Updated binding listeners dynamically adapting both localized URL endpoints (`pennys.home`) and external physical IPs (`192.168.0.111`) bypassing complicated DNS hardware router re-configurations.

4. **Account Initialization**
   - Injected the master Admin account (`rahul`) using Python async sessions directly upon initial deployment.
   - Generated the supplementary Editor account (`penny`) simulating the first organizational hire effectively preparing the dashboard for simultaneous testing.

### Validation Results
- ✅ **Backend Daemon**: `systemctl status pennys-backend.service` reports sustained activity successfully managing the `uvicorn` background execution.
- ✅ **Network Mapping**: Caddy executes reverse proxy rules simultaneously permitting interactions via `pennys.home` and `192.168.0.111`.
- ✅ **Authentication Workflows**: Successfully demonstrated user verification processing seeded accounts validating the production DB mappings.
- ✅ PWA definitions gracefully present allowing iOS / Android systems to install the site bypassing traditional browsers natively.

### March 18, 2026 - Recent Fixes

1. Fixed order submission bug (SQLAlchemy `MissingGreenlet` due to async lazy loading).
2. Fixed Dashboard sync error by handling Firebase initialization fallback on missing config.
3. Fixed blank `/admin` page due to missing import mapping in `Admin.jsx`.
4. Defensively patched `AuditLog.jsx` rendering function to prevent malformed historical array data from breaking React components.
5. Reconfigured `auth_service.py` to remove the 12-hour timeout. JWT expirations extended permanently to guarantee continuous offline availability.
6. Ignored PyCache dynamically and scrubbed local untracked variables, , and artifacts for clean Git repo index setup.


### March 18, 2026 - Recent Updates

1. **Order Submission**: Fixed `MissingGreenlet` exceptions occurring implicitly from unawaited lazy-loading queries during order packaging over SQLAlchemy async db context.
2. **Dashboard Sync**: Enforced runtime fallback state for `firebase_admin._apps` offline detection missing credentials to gracefully reconnect inside the sync loop.
3. **Empty Admin Dash**: Injected missing `restoreFromCloud` imports into `Admin.jsx` component routing layout to properly mount.
4. **Blank Audit Log**: Completely refactored `diff` dictionary serialization inside `AuditLog.jsx` to recursively type-check historical metadata formats and intercept functional map errors to stop the entire parent page from unmounting.
5. **No Session Timeout**: Rewrote `auth_service.py` to strip out the standard 12 hour JWT validation threshold and extended `exp` token payloads to persist locally up to 100 years. User never needs to login again.
6. **Git/CICD Cleanup**: Hard purged tracked/untracked intermediate artifacts (`*.pyc`, `__pycache__/`, loose `test_*` scripts) and appended defensive .gitignore rules protecting local SQLite indices and `.env` variable stores.

## Phase 16: Local Testing Environment Setup

### Overview
In Phase 16, a robust local testing environment was configured to support a structured "test > fix > deploy" workflow, allowing development against a mirror of the production data schema.

### Changes Made

1. **Backend Initialization**
   - Configured `.venv` virtual environment and installed all dependencies from `requirements.txt`.
   - Setup an isolated `.env` supporting development overrides (`CORS_ORIGINS`, `DATABASE_URL`).
   - Integrated the existing `traegger-c0901-firebase-adminsdk-fbsvc-e92b5c9c29.json` for live cloud sync capabilities.
   - Built and applied `alembic upgrade head` resolving local database state.
   - Created `seed.py` enabling explicit database injection of Menu structures and Admin identities locally.

2. **Frontend Setup**
   - Successfully bootstrapped dependencies using `pnpm install` establishing full SPA support inside Vite.

3. **Automated Testing Suite (Pytest)**
   - Initialized a `tests/` directory verifying application stability automatically.
   - Built `test_auth.py` verifying JWT issuing flows and rejection thresholds.
   - Built `test_api.py` validating core CRUD endpoints dynamically bypassing HTTP calls internally.
   - Created `pytest.ini` supporting asynchronous session fixtures gracefully.

### Validation Results
- ✅ **Test Suite Success**: The internal API endpoints verified completely through automated `httpx` runners executing native `aiosqlite` read/writes.
- ✅ **Environment Parity**: The system seamlessly mimics production without exposing or breaking the core production database locally.
