# Penny's Cakes & More — Easter Bakery Dashboard
## Project Specification v4.0
**For use with agentic coding tools. Every section is a build directive.**

---

## Table of Contents
1. [Project Context](#1-project-context)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Roles](#5-authentication--roles)
6. [API Reference](#6-api-reference)
7. [Pages & UI Specification](#7-pages--ui-specification)
8. [Business Logic Rules](#8-business-logic-rules)
9. [Firebase Sync](#9-firebase-sync)
10. [Backup & Restore](#10-backup--restore)
11. [Hosting & Network](#11-hosting--network)
12. [Build Order](#12-build-order)
13. [Environment Variables](#13-environment-variables)
14. [Menu Seed Data](#14-menu-seed-data)

---

## 1. Project Context

### What This Is
An internal web application for **Penny's Cakes & More**, a home bakery in Thane, Maharashtra. Built as an Easter season trial. No public-facing pages. Staff only.

### Who Uses It
| Username | Display Name | Role | Scope |
|----------|-------------|------|-------|
| `rahul` | Rahul | `admin` | Full system access |
| `penny` | Penny | `editor` | Orders, kitchen, customers |
| *(any number of additional accounts)* | Staff | `viewer` or `editor` | Created by admin |

### Access Pattern
- **Primary:** All users on home LAN → `http://pennys.home`
- **Emergency external:** Tailscale VPN already installed on user devices → same URL works through Tailscale
- **No public internet exposure required**

### Constraints
- Single timezone: `Asia/Kolkata` (IST, UTC+5:30)
- Currency: INR (₹), stored as integers in paise (1 rupee = 100 paise) to avoid float errors
- Language: English only
- Max ~50 orders per day at peak Easter season
- Mobile-first UI (primary use is phone in kitchen)

---

## 2. Tech Stack

### Definitive Stack — Do Not Substitute Without Explicit Instruction

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend framework | React | 18.x | Vite as build tool |
| Frontend styling | Tailwind CSS | 3.x | Utility-first |
| UI components | shadcn/ui | latest | Radix-based, accessible |
| Charts | Recharts | 2.x | React-native responsive charts |
| Frontend state | Zustand | 4.x | Lightweight global state |
| HTTP client | Axios | 1.x | API calls from frontend |
| Backend language | Python | 3.11+ | |
| Backend framework | FastAPI | 0.110+ | Async, auto-generates OpenAPI docs |
| ORM | SQLAlchemy | 2.x | Async sessions |
| DB migrations | Alembic | 1.x | Version-controlled schema changes |
| Primary database | SQLite | 3.x | Single file, local on server |
| SQLite async driver | aiosqlite | 0.19+ | Required by SQLAlchemy async + SQLite |
| Cloud mirror | Firebase Firestore | — | Free Spark tier |
| Auth tokens | python-jose | — | JWT encoding/decoding |
| Password hashing | passlib[bcrypt] | — | bcrypt rounds=12 |
| Process manager | systemd | — | Linux built-in, no extra install |
| Reverse proxy | Caddy | 2.x | Local domain + HTTPS |

### Dev Tooling
- **Package manager (Python):** `uv` (faster than pip)
- **Package manager (JS):** `pnpm`
- **Linting (Python):** `ruff`
- **Linting (JS):** ESLint + Prettier
- **API testing:** FastAPI's built-in `/docs` (Swagger UI)

### Python Requirements (`backend/requirements.txt`)
```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
sqlalchemy[asyncio]>=2.0.0
aiosqlite>=0.19.0
alembic>=1.13.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.9
firebase-admin>=6.4.0
python-dotenv>=1.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
```

---

## 3. Repository Structure

```
pennys-dashboard/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLAlchemy engine + session factory
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── menu_item.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── order_item.py
│   │   ├── kitchen_batch.py
│   │   └── audit_log.py
│   ├── schemas/                 # Pydantic request/response models
│   │   ├── user.py
│   │   ├── menu_item.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   └── kitchen_batch.py
│   ├── routers/                 # One file per resource
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── menu.py
│   │   ├── customers.py
│   │   ├── orders.py
│   │   ├── kitchen.py
│   │   ├── production.py
│   │   ├── dashboard.py
│   │   └── backup.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── firebase_sync.py     # Background sync to Firestore
│   │   └── backup_service.py
│   ├── migrations/              # Alembic migration files
│   ├── seed_data.py             # Pre-loads Easter menu on first run
│   ├── requirements.txt
│   └── .env                     # Never commit — see §13
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/                 # Axios calls, one file per resource
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # One folder per page
│   │   │   ├── Login/
│   │   │   ├── Dashboard/
│   │   │   ├── Menu/
│   │   │   ├── Orders/
│   │   │   ├── OrderDetail/
│   │   │   ├── Customers/
│   │   │   ├── Production/
│   │   │   ├── Kitchen/
│   │   │   └── Admin/
│   │   ├── store/               # Zustand stores
│   │   └── utils/
│   ├── public/
│   │   └── manifest.json        # PWA manifest
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Caddyfile                    # Reverse proxy config
├── pennys-dashboard.service     # systemd service file
├── .gitignore
└── README.md
```

### `.gitignore` (minimum required contents)
```
# Secrets — NEVER commit these
backend/.env
backend/firebase-service-account.json

# Database file — lives on server only
backend/*.db
backend/*.db-shm
backend/*.db-wal

# Python
__pycache__/
*.pyc
*.pyo
.venv/
*.egg-info/

# Node
node_modules/
frontend/dist/

# OS
.DS_Store
Thumbs.db
```

---

## 4. Database Schema

> All monetary values stored in **paise (integer)**. 1000 paise = ₹10.00.  
> All timestamps stored as **UTC ISO 8601**. Display in IST (UTC+5:30).  
> SQLite `BOOLEAN` = INTEGER (0/1). `DATETIME` = TEXT (ISO format).

### Table: `users`
```sql
CREATE TABLE users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
    is_active       INTEGER NOT NULL DEFAULT 1,
    session_version INTEGER NOT NULL DEFAULT 1,  -- increment to invalidate all active sessions for this user
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    last_login      TEXT
);
```

### Table: `menu_items`
```sql
CREATE TABLE menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL CHECK(category IN (
                    'fruit_cakes_premium', 'cakes_standard',
                    'marzipan_treats', 'gift_boxes_bakery', 'homemade', 'other'
                )),
    size_unit   TEXT NOT NULL,          -- e.g. "1/2 kg bar", "6 pcs", "1 litre"
    price_paise INTEGER NOT NULL,       -- e.g. 75000 = ₹750
    is_available INTEGER NOT NULL DEFAULT 1,
    notes       TEXT,                   -- allergens, advance notice, etc.
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Table: `customers`
```sql
CREATE TABLE customers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    phone           TEXT,               -- primary contact, used for search
    whatsapp        TEXT,               -- may differ from phone
    instagram       TEXT,
    email           TEXT,
    default_address TEXT,
    notes           TEXT,               -- e.g. "always wants double-boxed"
    is_vip          INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Table: `orders`
```sql
CREATE TABLE orders (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id         INTEGER NOT NULL REFERENCES customers(id),
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK(status IN ('pending','confirmed','in_progress',
                                             'ready','delivered','cancelled')),
    order_date          TEXT NOT NULL DEFAULT (date('now')),
    due_date            TEXT NOT NULL,  -- pickup/delivery date
    fulfillment_type    TEXT NOT NULL CHECK(fulfillment_type IN ('pickup','delivery')),
    delivery_address    TEXT,           -- required if fulfillment_type = 'delivery'
    subtotal_paise      INTEGER NOT NULL DEFAULT 0,  -- auto-calculated
    discount_type       TEXT CHECK(discount_type IS NULL OR discount_type IN ('flat','percent')),
    discount_value      INTEGER NOT NULL DEFAULT 0,  -- paise if flat, basis points if percent
    discount_paise      INTEGER NOT NULL DEFAULT 0,  -- computed absolute discount
    total_paise         INTEGER NOT NULL DEFAULT 0,  -- subtotal - discount
    payment_status      TEXT NOT NULL DEFAULT 'unpaid'
                            CHECK(payment_status IN ('unpaid','partial','paid')),
    amount_paid_paise   INTEGER NOT NULL DEFAULT 0,
    special_instructions TEXT,
    internal_notes      TEXT,
    is_deleted          INTEGER NOT NULL DEFAULT 0,  -- soft delete
    deleted_at          TEXT,
    deleted_by          INTEGER REFERENCES users(id),
    created_by          INTEGER NOT NULL REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Table: `order_items`
```sql
CREATE TABLE order_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    menu_item_id    INTEGER NOT NULL REFERENCES menu_items(id),
    quantity        INTEGER NOT NULL CHECK(quantity > 0),
    unit_price_paise INTEGER NOT NULL,  -- snapshot of price at time of order
    line_total_paise INTEGER NOT NULL,  -- quantity * unit_price_paise
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Table: `kitchen_batches`
```sql
CREATE TABLE kitchen_batches (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id    INTEGER NOT NULL REFERENCES menu_items(id),
    batch_date      TEXT NOT NULL,      -- the date this batch is for
    quantity        INTEGER NOT NULL,
    stage           TEXT NOT NULL DEFAULT 'queued'
                        CHECK(stage IN ('queued','prepping','baking',
                                        'cooling','decorating','packed','assigned')),
    stage_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    stage_updated_by INTEGER REFERENCES users(id),
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Table: `kitchen_batch_order_assignments`
```sql
-- Links a kitchen batch to one or more orders it will fulfil
CREATE TABLE kitchen_batch_order_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id        INTEGER NOT NULL REFERENCES kitchen_batches(id),
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    quantity        INTEGER NOT NULL,   -- how many from this batch go to this order
    assigned_at     TEXT NOT NULL DEFAULT (datetime('now')),
    assigned_by     INTEGER NOT NULL REFERENCES users(id)
);
```

### Table: `kitchen_stage_log`
```sql
-- Immutable log of every stage change for a batch
CREATE TABLE kitchen_stage_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id    INTEGER NOT NULL REFERENCES kitchen_batches(id),
    from_stage  TEXT,
    to_stage    TEXT NOT NULL,
    changed_by  INTEGER NOT NULL REFERENCES users(id),
    changed_at  TEXT NOT NULL DEFAULT (datetime('now')),
    note        TEXT
);
```

### Table: `audit_log`
```sql
-- Immutable record of every create/update/delete on orders, customers, menu
CREATE TABLE audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    action      TEXT NOT NULL CHECK(action IN ('create','update','delete','restore')),
    entity_type TEXT NOT NULL,          -- 'order', 'customer', 'menu_item', etc.
    entity_id   INTEGER NOT NULL,
    diff        TEXT,                   -- JSON: {field: [old_value, new_value]}
    timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 5. Authentication & Roles

### Login Flow
```
POST /api/auth/login
  → verify username exists and is_active = 1
  → verify password against bcrypt hash
  → return signed JWT (payload: user_id, username, role, exp)
  → frontend stores JWT in memory (Zustand) + httpOnly cookie

All subsequent API requests:
  → send JWT in Authorization: Bearer <token> header
  → backend decodes + validates on every request via FastAPI dependency
```

### JWT Specification
```python
ALGORITHM   = "HS256"
EXPIRE_HOURS = 12          # standard session
EXPIRE_DAYS  = 7           # if "remember me" checked
SECRET_KEY   = env var JWT_SECRET_KEY  # min 32 random chars, see §13
```

### Role Permission Matrix
| Endpoint Category | `viewer` | `editor` | `admin` |
|---|:---:|:---:|:---:|
| GET (read) — all resources | ✅ | ✅ | ✅ |
| POST/PUT/PATCH — orders | ❌ | ✅ | ✅ |
| POST/PUT/PATCH — customers | ❌ | ✅ | ✅ |
| DELETE — orders (soft) | ❌ | ✅ | ✅ |
| POST/PUT/PATCH — kitchen batches | ❌ | ✅ | ✅ |
| POST/PUT/PATCH/DELETE — menu items | ❌ | ❌ | ✅ |
| GET/POST/PUT/DELETE — users | ❌ | ❌ | ✅ |
| GET — audit log | ❌ | ❌ | ✅ |
| POST — backup export | ❌ | ❌ | ✅ |
| POST — restore from backup | ❌ | ❌ | ✅ |
| POST — force Firebase sync | ❌ | ❌ | ✅ |

### User Management Rules
- Only admin can create, edit, deactivate accounts
- No self-registration endpoint exists
- Deactivate = set `is_active = 0` (never hard delete a user)
- Password reset by admin: admin sets a new temporary password, user logs in normally
- Admin can invalidate a specific user's sessions by rotating a per-user `session_version` int stored in the users table; include `session_version` in JWT payload and validate on each request

---

## 6. API Reference

> Base path: `/api`  
> All responses: `Content-Type: application/json`  
> Auth required on all routes except `POST /api/auth/login`

### Auth
| Method | Path | Body | Response | Roles |
|--------|------|------|----------|-------|
| POST | `/auth/login` | `{username, password, remember_me?}` | `{access_token, token_type, user}` | public |
| POST | `/auth/logout` | — | `{ok: true}` | any |
| GET | `/auth/me` | — | `User` object | any |

### Users (admin only)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/users` | List all users |
| POST | `/users` | Create new user |
| GET | `/users/{id}` | Get single user |
| PUT | `/users/{id}` | Edit user (role, display_name, is_active) |
| POST | `/users/{id}/reset-password` | Admin sets new password |
| POST | `/users/{id}/force-logout` | Increments session_version |

### Menu Items
| Method | Path | Notes |
|--------|------|-------|
| GET | `/menu` | All items (active + inactive). Query: `?category=`, `?available_only=true` |
| POST | `/menu` | Create item. Admin only. |
| GET | `/menu/{id}` | Single item |
| PUT | `/menu/{id}` | Update item. Admin only. |
| PATCH | `/menu/{id}/availability` | Toggle `is_available`. Admin only. |

### Customers
| Method | Path | Notes |
|--------|------|-------|
| GET | `/customers` | List. Query: `?search=` (name or phone), `?vip_only=true` |
| POST | `/customers` | Create |
| GET | `/customers/{id}` | Single customer |
| PUT | `/customers/{id}` | Update |
| GET | `/customers/{id}/orders` | All orders for this customer |
| PATCH | `/customers/{id}/deactivate` | Sets `is_active=0`. Admin only. Does not delete. |

### Orders
| Method | Path | Notes |
|--------|------|-------|
| GET | `/orders` | List. Query: `?status=`, `?payment_status=`, `?due_date=`, `?customer_id=`, `?search=`, `?include_deleted=true` (admin only) |
| POST | `/orders` | Create. Recalculates totals server-side. |
| GET | `/orders/{id}` | Full order detail including items |
| PUT | `/orders/{id}` | Full update. Recalculates totals server-side. |
| PATCH | `/orders/{id}/status` | `{status}` only |
| PATCH | `/orders/{id}/payment` | `{payment_status, amount_paid_paise}` only |
| DELETE | `/orders/{id}` | Soft delete. Sets `is_deleted=1, deleted_at, deleted_by` |
| POST | `/orders/{id}/restore` | Undelete. Admin only. |
| POST | `/orders/{id}/duplicate` | Creates new draft order copying items + customer |
| GET | `/orders/{id}/audit` | Full change history. Admin only. |

### Production Planning
| Method | Path | Notes |
|--------|------|-------|
| GET | `/production/summary` | Query: `?date=YYYY-MM-DD` or `?from=&to=` or `?range=today\|tomorrow\|week` |

Returns: items aggregated across orders where `status IN ('confirmed', 'in_progress', 'ready')` and `due_date` falls within the requested range. Excludes `pending` (not yet confirmed), `cancelled`, `delivered`, and soft-deleted orders.
```json
{
  "date_range": {"from": "2026-04-18", "to": "2026-04-18"},
  "items": [
    {
      "menu_item_id": 1,
      "name": "Dark Fruit Cake",
      "size_unit": "1/2 kg bar",
      "total_quantity": 5,
      "orders": [
        {"order_id": 12, "customer_name": "Maria", "quantity": 2, "due_date": "2026-04-18"},
        {"order_id": 17, "customer_name": "John", "quantity": 3, "due_date": "2026-04-18"}
      ]
    }
  ]
}
```

### Kitchen Tracker
| Method | Path | Notes |
|--------|------|-------|
| GET | `/kitchen/batches` | Query: `?date=YYYY-MM-DD` (default today) |
| POST | `/kitchen/batches` | Create a new batch |
| PATCH | `/kitchen/batches/{id}/stage` | `{stage, note?}` — advances stage, writes to stage_log |
| POST | `/kitchen/batches/{id}/assign` | `{assignments: [{order_id, quantity}]}` |
| GET | `/kitchen/batches/{id}/log` | Full stage history for a batch |

### Dashboard
| Method | Path | Notes |
|--------|------|-------|
| GET | `/dashboard/summary` | All metrics cards in one call (see §7 Dashboard) |

### Backup
| Method | Path | Notes |
|--------|------|-------|
| GET | `/backup/export` | Returns JSON file download (`Content-Disposition: attachment`). Admin only. Query: `?format=json` (default) or `?format=csv&table=orders` |
| POST | `/backup/import` | Multipart form upload of backup JSON. Admin only. |
| POST | `/backup/firebase-sync` | Force full push to Firestore. Admin only. |

---

## 7. Pages & UI Specification

### Global UI Rules
- **Bottom navigation bar** on mobile (≤768px): Dashboard, Orders, Production, Kitchen, More
  - **"More" drawer contains:** Customers, Menu, Admin Settings (admin only), Logout
- **Sidebar navigation** on desktop (>768px): all pages visible directly
- **Minimum tap target:** 48px height on all interactive elements
- **Body font size:** minimum 16px
- **Sticky footer buttons:** Save, Submit, Confirm always pinned to bottom of viewport on mobile
- **No horizontal scrolling:** Tables become card stacks on mobile
- **Color-coded statuses** (use these exact colors consistently):

| Status | Color | Tailwind class |
|--------|-------|----------------|
| pending | Slate | `bg-slate-400` |
| confirmed | Blue | `bg-blue-600` |
| in_progress | Amber | `bg-amber-500` |
| ready | Green | `bg-green-500` |
| delivered | Emerald dark | `bg-emerald-700` |
| cancelled | Red | `bg-red-600` |
| unpaid | Red | `bg-red-500` |
| partial | Amber | `bg-amber-400` |
| paid | Green | `bg-green-500` |

### 7.1 Login Page
- Fields: username (text), password (password + show/hide toggle), remember me (checkbox)
- On submit: `POST /api/auth/login`
- On success: redirect to Dashboard
- On error: show inline error "Invalid username or password" (do not specify which is wrong)
- No signup link, no forgot password link (admin handles this)

### 7.2 Dashboard
`GET /api/dashboard/summary` returns:
```json
{
  "orders_today": 3,
  "orders_due_tomorrow": 5,
  "total_orders_active": 42,
  "revenue_collected_paise": 125000,
  "revenue_outstanding_paise": 45000,
  "revenue_total_paise": 170000,
  "orders_by_status": {"pending": 2, "confirmed": 8, "in_progress": 4, "ready": 1, ...},
  "recent_orders": [...],         // last 5 orders
  "top_items": [...],             // top 5 items by quantity ordered this season
  "firebase_sync_status": "synced" | "syncing" | "error" | "offline"
}
```
Display as: metric cards (top row), then status donut chart + revenue bar chart side by side, then recent orders feed, then quick action buttons (New Order, Today's Production, View Unpaid).

### 7.3 Menu Page
- Two views: Card grid (default mobile) / Table (default desktop). Toggle button.
- Group cards by category.
- Each card shows: name, size/unit, price, availability badge.
- Admin only: Add Item button (top right), Edit / Toggle Availability per item.
- Non-admin: read-only view.
- Price display: convert paise to ₹ (divide by 100, show 2 decimal places if needed, e.g. ₹750.00 → show as ₹750).

### 7.4 Orders List Page
**Filters (persistent in URL params):**
- Status (multi-select)
- Payment status (multi-select)
- Due date (date picker or quick: today / tomorrow / this week)
- Customer search (text)
- Fulfillment type (pickup / delivery / all)

**Table columns (desktop):** Order ID, Customer, Due Date, Items summary, Total, Payment, Status, Actions  
**Card view (mobile):** Customer name + due date prominent, total + payment badge, status badge, tap to open detail

**Actions per row:**
- Tap → opens Order Detail page
- Swipe left (mobile) → quick actions: Edit, Mark Paid, Delete
- Admin only: shows soft-deleted orders when "Show deleted" toggle is on, with Restore button

### 7.5 Order Detail Page
Shows all order fields. Editor/Admin see Edit button which opens same form inline.

**Sections:**
1. Header: Order ID, status badge, due date, fulfillment type
2. Customer block: name, phone (tappable to call on mobile), WhatsApp link
3. Items table: item name, qty, unit price, line total
4. Pricing block: subtotal, discount, total, amount paid, balance due
5. Instructions: special instructions, internal notes
6. Kitchen status: for each item in the order, shows linked batch stage (if any)
7. Audit log (admin only): collapsible, shows all changes

### 7.6 Order Form (Create / Edit)
- Customer field: search-as-you-type from customer list. "New customer" option opens inline mini-form (name + phone only, full details editable later).
- Items section: search-as-you-type from available menu items. Add multiple lines. Quantity spinner. Unit price auto-fills from menu but is editable.
- Discount: select type (none / flat ₹ / percent %), enter value. Total auto-updates live.
- Payment status: dropdown. If "partial" selected, show "Amount paid" field.
- Delivery address field: only visible when fulfillment type = "delivery".
- All financial calculations happen server-side on save (frontend previews are for UX only).

### 7.7 Production Planning Page
**View selector:** Today | Tomorrow | This Week | Custom Range (tabs or segmented control)

For each view: sorted list of items, each showing:
- Item name + size/unit
- Total quantity needed (large, prominent)
- Expandable row: list of orders needing this item (customer name, qty, due date)
- Warning badge if `is_available = 0` for this item

**Print / Share button:** generates a plain-text or PDF list of items + quantities for the selected date. Formatted for kitchen use (large text).

### 7.8 Kitchen Tracker Page
**Date selector** at top (default today).

**Progress bar:** X of Y item batches fully assigned today.

**Batch card** (one per kitchen_batch row):
- Item name + quantity
- Stage pill (color-coded, same colors as order status table above for consistency)
- Last updated: "2 min ago by Penny"
- **"Advance Stage" button** — moves to next stage, records timestamp + user
- **"Set Stage" dropdown** — jump to any stage manually
- Expand card → shows full stage timestamp log
- If stage = `packed`: shows "Assign to Order" button → opens modal with list of orders needing this item, select + enter quantity per order
- Notes field per batch (editable inline)

**Completed section:** batches fully assigned collapse to a "Done Today" section at the bottom.

### 7.9 Customer Directory
- Search bar (name or phone) at top
- List of customer cards: name, phone, order count, lifetime spend, VIP badge
- Tap → Customer Detail: all fields, edit button, full order history table
- VIP toggle (editor/admin)

### 7.10 Admin Settings Page
**Sections:**
1. **User Accounts** — table of all users, add/edit/deactivate, reset password, force logout
2. **Menu** — redirect to menu page (admin edit mode)
3. **Backup & Restore** — export buttons, import upload, last backup timestamp
4. **Firebase Sync** — sync status, last sync time, "Force Sync Now" button
5. **Audit Log** — searchable/filterable table of all audit_log entries
6. **Deleted Orders** — table of soft-deleted orders with Restore / Permanently Delete buttons

---

## 8. Business Logic Rules

These rules are enforced **server-side**. Frontend may preview but backend is authoritative.

### Order Totals Calculation
```
subtotal_paise    = SUM(order_items.quantity * order_items.unit_price_paise)
discount_paise    = if discount_type == 'flat'    → discount_value (already in paise)
                    if discount_type == 'percent'  → ROUND(subtotal * discount_value / 10000)
                    if discount_type == NULL        → 0
total_paise       = subtotal_paise - discount_paise
balance_due_paise = total_paise - amount_paid_paise
```

> Note: `discount_value` for percent is stored in basis points (1% = 100 basis points) to avoid floats.

### Payment Status Auto-Update
```
if amount_paid_paise == 0                  → payment_status = 'unpaid'
if amount_paid_paise >= total_paise        → payment_status = 'paid'
if 0 < amount_paid_paise < total_paise    → payment_status = 'partial'
```
This recalculation runs on every order save and on every `PATCH /orders/{id}/payment`.

### Order Auto-Status: Ready
```
When all order_items for an order have a corresponding kitchen_batch_order_assignment
with total assigned quantity >= ordered quantity:
  → set order.status = 'ready'  (only if current status is 'in_progress' or 'confirmed')
```

### Soft Delete
- `DELETE /orders/{id}` sets `is_deleted=1`, records `deleted_at` and `deleted_by`
- Soft-deleted orders are excluded from all GET /orders responses unless `?include_deleted=true` (admin only)
- Soft-deleted orders are excluded from production planning and dashboard counts
- Permanent deletion: only available to admin, only on records where `is_deleted=1` and `deleted_at` is > 30 days ago

### Audit Logging
Write to `audit_log` on every:
- `POST` to orders, customers, menu_items (action = 'create')
- `PUT`, `PATCH` to orders, customers, menu_items (action = 'update', diff = changed fields only)
- `DELETE` (action = 'delete')
- `POST /orders/{id}/restore` (action = 'restore')

`diff` format:
```json
{"status": ["confirmed", "in_progress"], "internal_notes": [null, "check oven temp"]}
```

### Kitchen Batch Stage Transitions
- Any stage can be set to any other stage (no enforced linear progression — kitchen is flexible)
- Every stage change writes a row to `kitchen_stage_log` (immutable, never deleted)
- Stage changes are allowed by `editor` and `admin` only

### Menu Item Price Snapshot
- `order_items.unit_price_paise` is set to `menu_items.price_paise` at the time the order is created
- Subsequent changes to the menu item price do NOT retroactively change existing orders
- This is intentional: orders are a legal/financial record

---

## 9. Firebase Sync

### Purpose
Firebase Firestore acts as a cloud mirror for disaster recovery and potential remote reads. SQLite is always the source of truth.

### Sync Status Storage
`firebase_sync_status` is an **in-memory application state variable** on the backend (not stored in SQLite). It is initialised to `"synced"` on startup, set to `"syncing"` when a background task starts, `"synced"` on success, `"error"` on failure, and `"offline"` if the Firebase SDK reports no connectivity. Store it as a module-level variable in `services/firebase_sync.py` and expose it via a getter function called by the dashboard endpoint.

### When Sync Happens
- **Write-through:** After every successful write to SQLite, a background task pushes the change to Firestore
- **Startup sync:** On app start, compare local `updated_at` timestamps against Firestore; pull anything newer from Firestore only if local record is missing (never overwrite local with cloud)
- **Manual sync:** `POST /api/backup/firebase-sync` does a full push of all records

### Firestore Collections
Mirror each SQLite table as a Firestore collection. Document ID = SQLite row ID as string.
```
/users/{id}
/menu_items/{id}
/customers/{id}
/orders/{id}
/order_items/{id}
/kitchen_batches/{id}
/kitchen_batch_order_assignments/{id}
/kitchen_stage_log/{id}
```

### Sync Implementation
```python
# In services/firebase_sync.py
# Use firebase-admin Python SDK
# Run sync operations as FastAPI BackgroundTasks (non-blocking)
# On failure: log error, set sync_status = 'error', do NOT fail the main request
# Retry failed syncs: queue with exponential backoff (max 3 retries)
```

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // Block all client SDK access
      // Only server-side Admin SDK (service account) can read/write
    }
  }
}
```

### Sync Status Indicator (Frontend)
- Poll `GET /api/dashboard/summary` every 60 seconds for `firebase_sync_status`
- Display a small status dot in the header/nav: green (synced), amber (syncing), red (error), grey (offline)

---

## 10. Backup & Restore

### Export Format
Single JSON file. Filename: `pennys_backup_YYYY-MM-DD_HHMMSS.json`

```json
{
  "version": "1.0",
  "exported_at": "2026-04-18T14:30:00+05:30",
  "exported_by": "rahul",
  "tables": {
    "users": [...],
    "menu_items": [...],
    "customers": [...],
    "orders": [...],
    "order_items": [...],
    "kitchen_batches": [...],
    "kitchen_batch_order_assignments": [...],
    "kitchen_stage_log": [...],
    "audit_log": [...]
  }
}
```

### Restore Rules
- Restore is **additive by default**: imports records that don't exist locally (matched by ID)
- Existing records are NOT overwritten unless `?overwrite=true` param is passed (admin must confirm with a second dialog)
- Users table: passwords in backup are already hashed → restore as-is
- After restore: run a full Firebase sync automatically

### CSV Export (per table)
`GET /api/backup/export?format=csv&table=orders` — downloads just that table as CSV. Useful for sharing with a spreadsheet.

---

## 11. Hosting & Network

### Server Setup (Raspberry Pi or similar Linux machine)

**1. Static IP reservation**
- In router admin → DHCP reservations → pin server MAC address to `192.168.1.100` (or any fixed IP)

**2. Local DNS entry**
- In router admin → DNS / Hostnames → add: `pennys.home → 192.168.1.100`
- If router doesn't support custom DNS: install `dnsmasq` on the server, configure it as local DNS resolver, point home devices to server IP as DNS

**3. App runs on port 8000 (backend) and 5173/built on port 80 (frontend via Caddy)**

**4. Caddyfile**
```
pennys.home {
    reverse_proxy localhost:8000
    encode gzip
}
```
For HTTPS on LAN: Caddy will generate a self-signed cert. Accept the browser warning once per device.

**5. systemd service** (`/etc/systemd/system/pennys-dashboard.service`)
```ini
[Unit]
Description=Penny's Bakery Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pennys-dashboard/backend
ExecStart=/home/pi/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=on-failure
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```
Enable: `sudo systemctl enable pennys-dashboard && sudo systemctl start pennys-dashboard`

**6. Frontend**
- Build: `pnpm build` in frontend/ → outputs to `frontend/dist/`
- Caddy serves `frontend/dist/` as static files, proxies `/api/*` to backend

Updated Caddyfile:
```
pennys.home {
    root * /home/pi/pennys-dashboard/frontend/dist
    file_server
    reverse_proxy /api/* localhost:8000
    encode gzip
}
```

### Tailscale (External Access)
- Already installed on user devices
- Install `tailscale` on the server as well: `curl -fsSL https://tailscale.com/install.sh | sh`
- **Important — custom DNS for `pennys.home` over Tailscale requires one extra step:** In the Tailscale admin console (tailscale.com/admin/dns), add your home router/server IP as a "Custom nameserver" and enable "Override local DNS". This tells Tailscale to use your home DNS for name resolution, which makes `pennys.home` resolve correctly when outside the home network.
- Without this step, `pennys.home` will not resolve over Tailscale — users outside home would need to use the server's Tailscale IP directly (e.g. `http://100.x.x.x:80`) until DNS is configured.

---

## 12. Build Order

Build in this exact sequence. Each phase produces a working testable increment.

| Phase | What to Build | Done When |
|-------|--------------|-----------|
| **1** | Repo setup, virtual env, FastAPI skeleton, SQLite + Alembic, `users` table, `POST /auth/login`, `GET /auth/me`, JWT middleware, **seed default admin user from env vars** | Can log in as `rahul` via `/docs` Swagger UI |
| **2** | User management endpoints, role permission dependency, account create/edit/deactivate | Admin can create other accounts via API |
| **3** | `menu_items` table + all menu endpoints, seed Easter menu data (see §14) | Full menu accessible via API |
| **4** | React frontend scaffold, Vite + Tailwind + shadcn/ui, Login page, auth token handling, protected routes | Can log in via browser |
| **5** | Menu page (read-only view + admin edit) | Menu visible and editable in browser |
| **6** | `customers` table + all customer endpoints + Customers page | Can add and view customers |
| **7** | `orders` + `order_items` tables + all order endpoints + Orders list + Order form | Can create and view orders |
| **8** | Order Detail page, edit, delete (soft), restore, duplicate, status/payment quick-patch | Full order CRUD working |
| **9** | Production planning endpoint + Production page (today/tomorrow/week views) | Kitchen knows what to bake |
| **10** | `kitchen_batches` + stage log + assignment tables + all kitchen endpoints + Kitchen Tracker page | Kitchen workflow tracked end-to-end |
| **11** | Dashboard endpoint + Dashboard page with charts | Metrics visible |
| **12** | Audit log write on all mutations, audit log view in Admin settings | Change history working |
| **13** | Firebase sync background tasks, sync status indicator | Data mirrored to Firestore |
| **14** | Backup export/import endpoints + Admin settings page | Full admin panel working |
| **15** | Caddy + systemd setup, local domain config, PWA manifest | Installable at `pennys.home` |

---

## 13. Environment Variables

File: `backend/.env` — **never commit to git, add to .gitignore**

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./pennys.db

# Auth
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=12
JWT_REMEMBER_DAYS=7

# Firebase
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json

# App
APP_ENV=production
CORS_ORIGINS=http://pennys.home,http://localhost:5173
ADMIN_SEED_USERNAME=rahul
ADMIN_SEED_PASSWORD=<set a strong temporary password, change after first login>
```

---

## 14. Menu Seed Data

Run `python seed_data.py` on first setup. Only runs if `menu_items` table is empty.

All prices in paise (multiply ₹ by 100).

```python
MENU_SEED = [
    # Fruit Cakes Premium
    {"name": "Dark Fruit Cake",       "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "Dark Fruit Cake",       "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    {"name": "White Fruit Cake",      "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "White Fruit Cake",      "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    {"name": "Date & Walnut Cake",    "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "Date & Walnut Cake",    "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    # Cakes Standard
    {"name": "Carrot Walnut Cake",    "category": "cakes_standard",      "size_unit": "1/2 kg bar", "price_paise": 50000},
    {"name": "Carrot Walnut Cake",    "category": "cakes_standard",      "size_unit": "1/4 kg bar", "price_paise": 26000},
    {"name": "Banana Choc Chip Cake", "category": "cakes_standard",      "size_unit": "1/2 kg bar", "price_paise": 50000},
    {"name": "Banana Choc Chip Cake", "category": "cakes_standard",      "size_unit": "1/4 kg bar", "price_paise": 26000},
    # Marzipan Treats
    {"name": "Marzipan Egg",          "category": "marzipan_treats",     "size_unit": "60g",        "price_paise": 14000},
    {"name": "Marzipan Egg",          "category": "marzipan_treats",     "size_unit": "110g",       "price_paise": 24000},
    {"name": "Half Egg (Marzipan)",   "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 10000},
    {"name": "Bunny (Marzipan)",      "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 11000},
    {"name": "Chicken (Marzipan)",    "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 8500},
    {"name": "Bonnet (Marzipan)",     "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 8500},
    {"name": "Surprise Egg",          "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 25000, "notes": "Hollow with treats inside"},
    {"name": "Choco Walnut Egg",      "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 10000},
    # Gift Boxes & Bakery
    {"name": "Gift Box of 4 Eggs",   "category": "gift_boxes_bakery",   "size_unit": "4 pcs",      "price_paise": 59000},
    {"name": "Assorted Box",          "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 69000},
    {"name": "Rich Choc Brownie",     "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 60000},
    {"name": "Brownie Bites Tub",     "category": "gift_boxes_bakery",   "size_unit": "1 tub",      "price_paise": 32500},
    {"name": "Macarons",              "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 45000},
    # Homemade
    {"name": "Bottle Masala",         "category": "homemade",            "size_unit": "1/4 kg bottle", "price_paise": 50000},
    {"name": "Black Currant Wine",    "category": "homemade",            "size_unit": "1 litre",    "price_paise": 50000},
]
```

---

*Spec version 4.0 — Penny's Cakes & More, Thane — Easter 2026*  
*Rahul (Admin) · Penny (Editor)*
