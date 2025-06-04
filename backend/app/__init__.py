
from .routers.embassy import router as embassy_router
from .routers.news import router as news_router
from .routers.auth import router as auth_router



__all__ = ["embassy_router", "news_router", "auth_router"]