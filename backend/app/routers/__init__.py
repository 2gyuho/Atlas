from .embassy import router as embassy_router
from .news import router as news_router
from .auth import router as auth_router
from .geolocation import router as geolocation_router
from .travel import router as travel_router

__all__ = ["embassy_router", "news_router", "auth_router", "geolocation_router", "travel_router"]
