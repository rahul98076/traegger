import asyncio
from seed_data import seed_menu
from database import AsyncSessionLocal
from main import get_password_hash
from models.user import User
from sqlalchemy.future import select
import os

async def seed():
    async with AsyncSessionLocal() as db:
        await seed_menu(db)
        
        # also seed admin just in case
        admin_username = os.getenv("ADMIN_SEED_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_SEED_PASSWORD", "admin")
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
            print("Admin seeded")

if __name__ == "__main__":
    asyncio.run(seed())
