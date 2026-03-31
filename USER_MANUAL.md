# Traegger User Manual

Welcome to the Traegger Bakery Management System. This tool is designed as a complete production and order management ERP for artisanal bakeries.

---

## 1. Interface Overview

- **Sidebar (Left)**: Your primary navigation for Orders, Customers, Menu, and Kitchen tracking.
- **Main Workspace**: Displays project data, tables, and forms based on your selection.
- **Mobile Access**: On mobile, use the top-left menu icon to toggle the sidebar.

---

## 2. Menu Management

- **Categorization**: Items are organized by category (e.g., *Cakes*, *Daily Bread*). Change view modes using the icons in the top right.
- **Adding Items**: (Admin Only) Click **"Add New Item"** to define name, category, unit, price, and notes.
- **Inventory Toggle**: Use the availability toggle on any item to instantly enable or disable it for new orders.

---

## 3. Customer Management

The Customers module acts as your central database for client information.

- **Adding Customers**: Log name, phone, WhatsApp, and delivery address.
- **VIP Status**: Enable the VIP toggle for key clients to mark them with a status icon throughout the system.
- **Search**: Use the top search bar to locate customers by name or phone number.

---

## 4. Operational Workflow

The system follows a logical lifecycle from order intake to physical production:

### Step 1: Order Intake
1. Create a **"New Order"** from the Orders page.
2. Select the customer and define the fulfillment date and type (Pickup/Delivery).
3. Add items from the menu, specifying quantities and any applicable discounts.

### Step 2: Order Lifecycle
1. **Payments**: Log advance payments or full settlements in the order details.
2. **Status**: Update the status from `Pending` through `Confirmed` and `In Progress` as the order moves through the workflow.

### Step 3: Production Aggregation
The Production page automatically aggregates all items due for a specific period (Today, Tomorrow, This Week). This provides the kitchen with total quantities required for prep.

### Step 4: Kitchen Tracking
1. Create a **"New Batch"** for items currently in production.
2. Update the batch stage as it moves from `Queued` → `Baking` → `Cooling` → `Decorating` → `Packed`.
3. **Assigning**: Once packed, link the batch to the specific customer orders waiting for fulfillment.

---

## 5. Analytics & Monitoring

The Dashboard provides a real-time overview of business performance:
- **Metrics**: Track revenue, pending collections, and scheduled pickups for the day.
- **System Status**: The status indicator confirms that data is synchronized and backed up.

---

## 6. Administration

- **User Accounts**: Manage employee access and roles. Admins can "Force Logout" any active session if necessary.
- **Audit Trail**: Access the "System Audit" tab to review a log of all data changes, including before/after values and responsible users.
- **Data Management**: Use the "Data" tab for manual exports. This supplements the automated system-wide backups.