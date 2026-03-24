import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
import traceback

from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal, get_db
from models.user import User
from routers import auth, users, menu, customers, orders, production, kitchen, dashboard, backup
from models.audit_log import AuditLog
from models.error_log import ErrorLog
from services.auth_service import require_role, get_password_hash
admin_only = require_role(["admin"])
from seed_data import seed_menu
import firebase_admin
from firebase_admin import credentials, firestore
from services.firebase_sync import full_sync_to_firestore

# Initialize Firebase
firebase_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT", "traegger-c0901-firebase-adminsdk-fbsvc-e92b5c9c29.json")
if os.path.exists(firebase_key_path):
    cred = credentials.Certificate(firebase_key_path)
    firebase_admin.initialize_app(cred, {
        'projectId': 'traegger-c0901',
    })

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed admin user if it doesn't exist
    async with AsyncSessionLocal() as db:
        admin_username = os.getenv("ADMIN_SEED_USERNAME")
        admin_password = os.getenv("ADMIN_SEED_PASSWORD")
        if admin_username and admin_password:
            result = await db.execute(select(User).where(User.username == admin_username))
            user = result.scalar_one_or_none()
            if not user:
                new_admin = User(
                    username=admin_username,
                    display_name="Admin",
                    hashed_password=get_password_hash(admin_password),
                    role="admin"
                )
                db.add(new_admin)
                await db.commit()
        
        # Seed Menu if it executes empty
        await seed_menu(db)

        # Startup Cloud Sync (Phase 13)
        await full_sync_to_firestore(db)
    yield

app = FastAPI(
    title="Penny's Bakery Dashboard API",
    version="1.0.0",
    lifespan=lifespan
)

origins_str = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — logs unhandled errors to error_logs table
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    try:
        async with AsyncSessionLocal() as db:
            log = ErrorLog(
                level="ERROR",
                method=request.method,
                path=str(request.url.path),
                status_code=500,
                error_message=str(exc)[:1000],
                traceback_text=tb[:5000],
            )
            db.add(log)
            await db.commit()
    except Exception as log_err:
        print("ERROR_LOGGER: Failed to persist error:", log_err)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(menu.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(production.router, prefix="/api")
app.include_router(kitchen.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(backup.router, prefix="/api")

# Admin Router for global logs and backups
admin_router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(admin_only)])

@admin_router.get("/audit")
async def get_all_audit_logs(
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    from sqlalchemy import desc
    from database import get_db
    import json
    
    result = await db.execute(
        select(AuditLog, User.username)
        .join(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.timestamp))
        .offset(offset)
        .limit(limit)
    )
    
    logs = []
    for log, username in result:
        logs.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "diff": json.loads(log.diff) if log.diff else None,
            "timestamp": log.timestamp,
            "username": username
        })
    return logs

# Admin error logs endpoint
@admin_router.get("/error-logs")
async def get_error_logs(
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    from sqlalchemy import desc
    try:
        result = await db.execute(
            select(ErrorLog)
            .order_by(desc(ErrorLog.id))
            .offset(offset)
            .limit(limit)
        )
        logs = result.scalars().all()
        return [
            {
                "id": l.id,
                "timestamp": l.timestamp,
                "level": l.level,
                "method": l.method,
                "path": l.path,
                "status_code": l.status_code,
                "error_message": l.error_message,
                "traceback_text": l.traceback_text,
            }
            for l in logs
        ]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise

app.include_router(admin_router, prefix="/api")
