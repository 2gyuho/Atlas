from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from .config import settings

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None

db = MongoDB()

async def connect_to_mongodb():
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    db.database = db.client[settings.database_name]
    print(f"Connected to MongoDB - Database: {settings.database_name}")

async def close_mongodb_connection():
    db.client.close()
    print("Disconnected from MongoDB")

def get_database():
    return db.database
