# Penny's Bakery Dashboard - User Manual

Welcome to the Penny's Bakery Dashboard! This application is designed to be a complete Management and Production ERP tailored specifically for artisan baking workflows.

This document will walk you through exactly how to navigate the user interface, perform daily operations, and manage your bakery's workflow from start to finish.

---

## 1. Getting Started: The Interface

When you log in, you will be greeted by the main layout, which is split into two primary areas:
- **The Sidebar (Left):** This is your main navigation hub. Use it to jump between different modules like Orders, Customers, Menu, and the Kitchen Tracker.
- **The Main Workspace (Center/Right):** This is where all your data, tables, and forms appear based on what you selected in the sidebar. 

**Quick Tip:** On mobile devices, the sidebar collapses into a "Hamburger Menu" (three horizontal lines) in the top left corner. Tap it to open your navigation.

---

## 2. Managing Your Menu (`/menu`)

Before you can take orders, you need items to sell!

- **Viewing Items:** By default, items are organized neatly by category (e.g., *Standard Cakes, Marzipan Treats*). You can toggle between a "Grid" (cards) or "Table" view using the buttons in the top right.
- **Adding Items (Admin Only):** Click the blue **"Add New Item"** button. Fill out the Name, Category, Size/Unit (e.g., "1/2 kg"), Price (`₹`), and any special notes.
- **Out of Stock?** If you run out of ingredients for something (like White Fruit Cake), simply click the toggle switch on that item to turn it **Off (Grey)**. It instantly becomes "Unavailable" and staff won't accidentally be able to add it to new orders.

---

## 3. Managing Customers (`/customers`)

The Customers page acts as your digital address book.

- **Adding a Customer:** Click **"Add New Customer"**. You can log their Name, Phone, WhatsApp, and Address. 
- **VIP Status:** Notice the **"VIP Customer"** toggle? Turn this on for loyal clients. They will get a special Gold Star (⭐) next to their name anywhere they appear in the app!
- **Searching:** Use the search bar at the top to quickly find someone by name or phone number when they are standing at the counter.

---

## 4. The Daily Workflow: Taking Orders & Baking

This is the core lifecycle of how the app handles your bakery flow:

### Step 1: Taking an Order (`/orders`)
1. Click **"New Order"** in the top right of the Orders page.
2. Search and select the customer. 
3. Choose the **Due Date** (when they need it) and the **Fulfillment Type** (Pickup or Delivery).
4. Click **"Add Item"** to pull from your Menu. Adjust quantities as needed. Add a flat or percent discount if necessary. 
5. Hit **"Create Order"**. 

### Step 2: Tracking Payment & Status (`/orders`)
On an Order's Detail page, you can see its lifecycle. 
- **Payment:** When a customer pays an advance via GPay or Cash, click **Edit** and change the Payment Status to `Partial` or `Paid`, and type in the amount collected.
- **Order Status:** Move the order status logically from `Pending` ➔ `Confirmed`. Once it's actively being prepped in the kitchen, move it to `In Progress`.

### Step 3: Production Planning (`/production`)
The Production page is your automated clipboard. You *do not* edit anything here.
- Click on **"Today"**, **"Tomorrow"**, or **"This Week"**. 
- The app automatically looks at every active order due in that timeframe, groups the same items together, and tells you the exact aggregated quantities you need to bake. (e.g., *Total Due: 15 Marzipan Eggs*).

### Step 4: Tracking Kitchen Batches (`/kitchen`)
Now that you know what to bake, you manage the physical baking process here!
1. Click **"New Batch"**. 
2. Select the item (e.g., Marzipan Egg), set the Quantity you are making, and assign it to a Date. 
3. As the physical items move through your kitchen, click the "Update Stage" dropdown to move the batch along:
   `Queued` ➔ `Prepping` ➔ `Baking` ➔ `Cooling` ➔ `Decorating` ➔ `Packed`.
4. **Assigning:** Once baked, you can click "Assign Orders" to link those specific baked goods to the customer orders that were waiting for them!

---

## 5. Daily Dashboards & Analytics (`/dashboard`)

The Dashboard is your morning overview. It tells you how your business is doing right now.
- **Top Metrics:** Look at "Today's Revenue", how many orders are "Pending Collection", and how many are scheduled for "Pickup Today". 
- **Visual Charts:** Check the graphs to see your sales trends over the week or analyze your top-selling categories.
- **Cloud Sync:** In the top right corner, a green `Live` badge indicates that every order you make is safely backing up to your Google Firebase secure cloud.

---

## 6. Administrative Tools (Settings)

Only users with the **Admin** role can access the Settings gear at the bottom of the sidebar. 

- **User Accounts:** Need to give a new employee login access? Go to the "Users" tab, click "Add User", and assign them the "Editor" role. If someone quits, you can instantly hit **Force Logout** to kick them out of the app.
- **Audit Logs:** Check the "System Audit" tab. The app secretly records every single change made by any employee. If a price is changed or an order is deleted, the Audit Log tells you exactly *who* did it and the *before/after* values.
- **Database Backups:** Use the "Data" tab to download a full `.json` backup of your entire bakery's database straight to your local computer for safekeeping.