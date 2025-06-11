from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.database import connect_to_mongodb, close_mongodb_connection, create_mysql_tables
from .routers import embassy_router, news_router, auth_router, geolocation_router, travel_router
from .models import MySQLUser, Travel  # MySQL 테이블 생성을 위해 import

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    await create_mysql_tables()  # MySQL 테이블 생성
    yield
    await close_mongodb_connection()

app = FastAPI(
    title="Devine API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router)
app.include_router(embassy_router)
app.include_router(news_router)
app.include_router(geolocation_router, prefix="/api")
app.include_router(travel_router)

@app.get("/")
async def root():
    return {"message": "Welcome to Devine API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}