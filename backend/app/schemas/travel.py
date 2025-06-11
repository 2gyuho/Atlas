from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class TravelBase(BaseModel):
    title: str = Field(..., max_length=255)
    country: str = Field(..., max_length=10)
    city: str = Field(..., max_length=100)
    departure_date: datetime
    return_date: datetime
    stopovers: Optional[List[str]] = None
    notes: Optional[str] = None
    travel_items: Optional[List[str]] = None

class TravelCreate(TravelBase):
    pass

class TravelUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=10)
    city: Optional[str] = Field(None, max_length=100)
    departure_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    stopovers: Optional[List[str]] = None
    notes: Optional[str] = None
    travel_items: Optional[List[str]] = None

class TravelResponse(TravelBase):
    id: int
    user_email: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
