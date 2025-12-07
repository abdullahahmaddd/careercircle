from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGODB_URI)
    print("Connected to MongoDB")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

def get_database():
    return db.client[settings.DB_NAME]