from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, func
from sqlalchemy.orm import relationship
from ..core.database import Base

class MySQLUser(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)    
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    alert_enabled = Column(Boolean, default=False)
    alert_radius_km = Column(Integer, default=50)
    auto_location_tracking = Column(Boolean, default=False)  # 자동 위치 추적 설정
    location_update_frequency = Column(Integer, default=300)  # 위치 업데이트 빈도 (초)
    is_admin = Column(Boolean, default=False)  # 관리자 권한
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
      # 관계 설정
    travels = relationship("Travel", back_populates="user")
    alert_logs = relationship("AlertLog", back_populates="user")
