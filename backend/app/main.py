from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.database import connect_to_mongodb, close_mongodb_connection
from .routes import embassy_router, news_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
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

app.include_router(embassy_router)
app.include_router(news_router)

@app.get("/")
async def root():
    return {"message": "Welcome to Devine API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
