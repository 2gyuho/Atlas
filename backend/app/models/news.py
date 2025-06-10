from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class News(BaseModel):
    id: str = Field(alias="_id")
    title: str
    content: str
    date: Optional[str] = None  # 호환성을 위해 유지
    published: Optional[str] = None  # 실제 발행 날짜
    source: str
    url: Optional[str] = None
    category: Optional[str] = None
    locations: Optional[List[str]] = []
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
