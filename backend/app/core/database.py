from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import Optional
from .config import settings

# MongoDB 설정 (기존 - 대사관, 뉴스 등)
class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None

db = MongoDB()

async def connect_to_mongodb():
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    db.database = db.client[settings.database_name]
    print(f"Connected to MongoDB - Database: {settings.database_name}")

async def close_mongodb_connection():
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

def get_database():
    return db.database

# MySQL 설정 (새로 추가 - 사용자 정보)
mysql_engine = create_async_engine(
    settings.mysql_url,
    echo=True,  # SQL 쿼리 로깅 (개발 시에만)
    pool_pre_ping=True,
    pool_recycle=300
)

AsyncSessionLocal = async_sessionmaker(
    mysql_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

# MySQL 세션 의존성
async def get_mysql_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# 테이블 생성 함수
async def create_mysql_tables():
    async with mysql_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("MySQL tables created successfully")
