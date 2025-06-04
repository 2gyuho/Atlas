from pydantic import BaseModel
from typing import Optional

class Embassy(BaseModel):
    id: str
    mission_name: str
    phone_number: str
    address: str
    
    class Config:
        populate_by_name = True