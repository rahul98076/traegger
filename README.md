# Traegger Bakery Management System

A full-stack bakery management application with role-based access control, production planning, real-time cloud synchronization, and a comprehensive administrative dashboard.

## Project Structure
- **/backend**: FastAPI (Python) server, SQLAlchemy (SQLite), and Firebase Admin SDK.
- **/frontend**: React (Vite) application with Tailwind CSS and shadcn/ui.

## Key Features
- **Admin Dashboard**: User management, audit logs, database backups, and manual sync controls.
- **Production Tracker**: Aggregated item lists and order assignments for the kitchen.
- **Real-time Sync**: Automatic mirroring of local SQLite data to Firebase Cloud Firestore.
- **Audit Trail**: Field-level change tracking for all critical records.

## Local Development
Refer to the `README.md` in each subdirectory for specific setup instructions.

## Deployment
See the `deployment_guide.md` in the `brain/` directory for Ubuntu server setup instructions.
