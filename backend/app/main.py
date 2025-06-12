from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from .core.database import connect_to_mongodb, close_mongodb_connection, create_mysql_tables
from .routers import embassy_router, news_router, auth_router, geolocation_router, travel_router
from .routers.alerts import router as alerts_router
from .routers.admin import router as admin_router
from .routers.notifications import router as notifications_router
from .models import MySQLUser, Travel  # MySQL 테이블 생성을 위해 import
from .services.monitoring_service import monitoring_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    await create_mysql_tables()  # MySQL 테이블 생성
    
    # 백그라운드 모니터링 서비스 시작
    monitoring_task = asyncio.create_task(monitoring_service.start_monitoring())
    
    yield
    
    # 모니터링 서비스 중지
    monitoring_service.stop_monitoring()
    monitoring_task.cancel()
    
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
app.include_router(auth_router, prefix="/api")
app.include_router(embassy_router)
app.include_router(news_router)
app.include_router(geolocation_router, prefix="/api")
app.include_router(travel_router)
app.include_router(alerts_router)  # 알림 라우터 추가
app.include_router(admin_router)  # 관리자 라우터 추가
app.include_router(notifications_router)  # 웹 알림 라우터 추가

@app.get("/")
async def root():
    return {"message": "Welcome to Devine API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}