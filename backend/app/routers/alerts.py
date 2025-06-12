from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, Any
from pydantic import BaseModel
from ..core.database import get_mysql_session
from ..models.mysql_user import MySQLUser
from ..services.monitoring_service import monitoring_service
from ..services.alert_service import alert_service
from ..core.security import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class AlertSettings(BaseModel):
    alert_enabled: bool
    alert_radius_km: int = 50

class AutoLocationSettings(BaseModel):
    auto_location_tracking: bool
    location_update_frequency: int = 300

@router.put("/location")
async def update_user_location(
    location: LocationUpdate,
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """사용자 현재 위치 업데이트"""
    try:
        stmt = update(MySQLUser).where(
            MySQLUser.id == current_user.id
        ).values(
            current_latitude=location.latitude,
            current_longitude=location.longitude
        )
        await db.execute(stmt)
        await db.commit()
        
        return {
            "success": True,
            "message": "위치가 업데이트되었습니다.",
            "location": {
                "latitude": location.latitude,
                "longitude": location.longitude
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"위치 업데이트 실패: {str(e)}")

@router.put("/settings")
async def update_alert_settings(
    settings: AlertSettings,
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """알림 설정 업데이트"""
    try:
        stmt = update(MySQLUser).where(
            MySQLUser.id == current_user.id
        ).values(
            alert_enabled=settings.alert_enabled,
            alert_radius_km=settings.alert_radius_km
        )
        await db.execute(stmt)
        await db.commit()
        
        return {
            "success": True,
            "message": "알림 설정이 업데이트되었습니다.",
            "settings": {
                "alert_enabled": settings.alert_enabled,
                "alert_radius_km": settings.alert_radius_km
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"설정 업데이트 실패: {str(e)}")

@router.get("/settings")
async def get_alert_settings(current_user: MySQLUser = Depends(get_current_user)):
    """현재 알림 설정 조회"""
    return {
        "alert_enabled": current_user.alert_enabled or False,
        "alert_radius_km": current_user.alert_radius_km or 50,
        "auto_location_tracking": current_user.auto_location_tracking or False,
        "location_update_frequency": current_user.location_update_frequency or 300,
        "current_location": {
            "latitude": current_user.current_latitude,
            "longitude": current_user.current_longitude
        } if current_user.current_latitude and current_user.current_longitude else None
    }

@router.put("/auto-location")
async def update_auto_location_settings(
    settings: AutoLocationSettings,
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """자동 위치 추적 설정 업데이트"""
    try:
        stmt = update(MySQLUser).where(
            MySQLUser.id == current_user.id
        ).values(
            auto_location_tracking=settings.auto_location_tracking,
            location_update_frequency=settings.location_update_frequency
        )
        await db.execute(stmt)
        await db.commit()
        
        return {
            "success": True,
            "message": "자동 위치 추적 설정이 업데이트되었습니다.",
            "settings": {
                "auto_location_tracking": settings.auto_location_tracking,
                "location_update_frequency": settings.location_update_frequency
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"자동 위치 추적 설정 업데이트 실패: {str(e)}")

@router.get("/auto-location")
async def get_auto_location_settings(current_user: MySQLUser = Depends(get_current_user)):
    """자동 위치 추적 설정 조회"""
    return {
        "auto_location_tracking": current_user.auto_location_tracking or False,
        "location_update_frequency": current_user.location_update_frequency or 300
    }

@router.get("/check")
async def check_current_dangers(current_user: MySQLUser = Depends(get_current_user)):
    """현재 위치의 위험 상황 즉시 체크"""
    try:
        if not current_user.current_latitude or not current_user.current_longitude:
            raise HTTPException(
                status_code=400,
                detail="위치 정보가 없습니다. 먼저 위치를 설정해주세요."
            )
        
        result = await monitoring_service.check_user_now(current_user.id)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"위험 상황 체크 실패: {str(e)}")

@router.get("/nearby-dangers")
async def get_nearby_dangers(
    radius_km: int = 50,
    current_user: MySQLUser = Depends(get_current_user)
):
    """주변 위험 상황 목록 조회"""
    try:
        if not current_user.current_latitude or not current_user.current_longitude:
            raise HTTPException(
                status_code=400,
                detail="위치 정보가 없습니다. 먼저 위치를 설정해주세요."
            )
        
        dangerous_news = await alert_service.check_dangerous_news(
            current_user.current_latitude,
            current_user.current_longitude,
            radius_km
        )
        
        return {
            "user_location": {
                "latitude": current_user.current_latitude,
                "longitude": current_user.current_longitude
            },
            "search_radius_km": radius_km,
            "dangerous_news_count": len(dangerous_news),
            "dangerous_news": dangerous_news
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"주변 위험 상황 조회 실패: {str(e)}")

@router.post("/test-email")
async def test_alert_email(current_user: MySQLUser = Depends(get_current_user)):
    """테스트 알림 이메일 발송"""
    try:
        from ..services.email_service import email_service
        
        # 테스트용 가짜 위험 뉴스 데이터
        test_news = [{
            "title": "Test Alert: Emergency Drill",
            "content": "This is a test emergency alert to verify the alert system functionality.",
            "source": "Test System",
            "published": "2024-01-01",
            "url": "https://example.com",
            "danger_info": {
                "severity": "medium",
                "categories": ["public_safety"],
                "matched_keywords": ["emergency", "alert"]
            }
        }]
        
        success = await email_service.send_alert_email(
            current_user.email,
            test_news,
            "Test Location"
        )
        
        if success:
            return {"success": True, "message": "테스트 이메일이 발송되었습니다."}
        else:
            raise HTTPException(status_code=500, detail="테스트 이메일 발송에 실패했습니다.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"테스트 이메일 발송 실패: {str(e)}")

@router.get("/test-smtp")
async def test_smtp_connection():
    """SMTP 연결 테스트"""
    try:
        from ..services.email_service import email_service
        
        result = await email_service.test_smtp_connection()
        
        if result["success"]:
            return {"success": True, "message": result["message"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMTP 테스트 실패: {str(e)}")

@router.get("/monitoring/status")
async def get_monitoring_status():
    """모니터링 서비스 상태 확인"""
    return {
        "is_running": monitoring_service.is_running,
        "check_interval_seconds": monitoring_service.check_interval,
        "min_alert_interval_seconds": monitoring_service.min_alert_interval
    }

@router.get("/check-user-now/{user_id}")
async def check_user_now(user_id: int):
    """특정 사용자의 즉시 위험 체크"""
    try:
        result = await monitoring_service.check_user_now(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"사용자 체크 실패: {str(e)}")

@router.get("/test")
async def test_alerts_api():
    """알림 API 테스트 엔드포인트 (인증 불필요)"""
    return {
        "success": True,
        "message": "Alerts API is working!",
        "timestamp": datetime.now().isoformat()
    }
