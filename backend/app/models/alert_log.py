from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from ..core.database import Base

class AlertLog(Base):
    __tablename__ = "alert_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # 'email', 'notification'
    danger_type = Column(String(100), nullable=False)  # 'crime', 'natural_disaster', etc.
    danger_location = Column(String(255), nullable=True)  # 위험 발생 위치
    danger_latitude = Column(Float, nullable=True)
    danger_longitude = Column(Float, nullable=True)
    user_latitude = Column(Float, nullable=True)  # 알림 시점의 사용자 위치
    user_longitude = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)  # 위험과의 거리
    news_title = Column(String(500), nullable=True)  # 관련 뉴스 제목
    news_content = Column(Text, nullable=True)  # 뉴스 내용 일부
    is_sent = Column(Boolean, default=False)  # 발송 성공 여부
    error_message = Column(Text, nullable=True)  # 발송 실패 시 오류 메시지
    created_at = Column(DateTime, default=func.now())
    
    # 관계 설정
    user = relationship("MySQLUser", back_populates="alert_logs")
