from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Travel(Base):
    __tablename__ = "travels"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    country = Column(String(10), nullable=False)  # 국가 코드
    city = Column(String(100), nullable=False)
    departure_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime, nullable=False)
    stopovers = Column(JSON, nullable=True)  # 경유지 배열
    notes = Column(Text, nullable=True)  # 메모
    travel_items = Column(JSON, nullable=True)  # 여행준비물 배열
    user_email = Column(String(255), ForeignKey("users.email"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 설정
    user = relationship("MySQLUser", back_populates="travels")
