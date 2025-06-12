# filepath: c:\개발 프로젝트\Atlas 프로젝트\Test_K\backend\app\routers\admin.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timedelta
from ..core.database import get_mysql_session
from ..models.mysql_user import MySQLUser
from ..models.alert_log import AlertLog
from ..core.security import get_current_user, get_current_admin_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Pydantic 모델들
class UserLocationUpdate(BaseModel):
    user_id: int
    latitude: float
    longitude: float

class UserInfo(BaseModel):
    id: int
    email: str
    username: str
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    alert_enabled: bool
    alert_radius_km: int
    auto_location_tracking: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

class AlertLogInfo(BaseModel):
    id: int
    user_id: int
    user_email: str
    user_username: str
    alert_type: str
    danger_type: str
    danger_location: Optional[str]
    danger_latitude: Optional[float]
    danger_longitude: Optional[float]
    user_latitude: Optional[float]
    user_longitude: Optional[float]
    distance_km: Optional[float]
    news_title: Optional[str]
    is_sent: bool
    error_message: Optional[str]
    created_at: datetime

class AdminNotificationRequest(BaseModel):
    recipient_type: str  # "all", "specific", "location_based"
    user_ids: Optional[List[int]] = None  # for specific users
    location_latitude: Optional[float] = None  # for location-based
    location_longitude: Optional[float] = None  # for location-based
    radius_km: Optional[float] = None  # for location-based
    alert_type: str  # "email", "web", "both", "log_only"
    danger_type: str  # "admin_notice", "emergency", "warning", "info", "danger", "critical"
    title: str
    message: str
    location_name: Optional[str] = None

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    alert_enabled_users: int
    total_alerts_today: int
    failed_alerts_today: int
    admin_users: int

# 관리자 권한 확인 decorator
def admin_required(current_user: MySQLUser = Depends(get_current_admin_user)):
    return current_user

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(admin_required)
):
    """관리자 대시보드 통계 정보"""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 통계 쿼리 실행
    total_users_result = await db.execute(select(MySQLUser))
    total_users = len(total_users_result.scalars().all())
    
    active_users_result = await db.execute(
        select(MySQLUser).where(MySQLUser.auto_location_tracking == True)
    )
    active_users = len(active_users_result.scalars().all())
    
    alert_enabled_result = await db.execute(
        select(MySQLUser).where(MySQLUser.alert_enabled == True)
    )
    alert_enabled_users = len(alert_enabled_result.scalars().all())
    
    admin_users_result = await db.execute(
        select(MySQLUser).where(MySQLUser.is_admin == True)
    )
    admin_users = len(admin_users_result.scalars().all())
    
    total_alerts_result = await db.execute(
        select(AlertLog).where(AlertLog.created_at >= today)
    )
    total_alerts_today = len(total_alerts_result.scalars().all())
    
    failed_alerts_result = await db.execute(
        select(AlertLog).where(
            AlertLog.created_at >= today,
            AlertLog.is_sent == False
        )
    )
    failed_alerts_today = len(failed_alerts_result.scalars().all())
    
    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        alert_enabled_users=alert_enabled_users,
        total_alerts_today=total_alerts_today,
        failed_alerts_today=failed_alerts_today,
        admin_users=admin_users
    )

@router.get("/users", response_model=List[UserInfo])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(admin_required)
):
    """모든 사용자 목록 조회"""
    query = select(MySQLUser)
    
    if search:
        query = query.where(
            (MySQLUser.username.contains(search)) |
            (MySQLUser.email.contains(search))
        )
    
    result = await db.execute(query.offset(skip).limit(limit))
    users = result.scalars().all()
    
    return [UserInfo(
        id=user.id,
        email=user.email,
        username=user.username,
        current_latitude=user.current_latitude,
        current_longitude=user.current_longitude,
        alert_enabled=user.alert_enabled,
        alert_radius_km=user.alert_radius_km,
        auto_location_tracking=user.auto_location_tracking,
        is_admin=user.is_admin,
        created_at=user.created_at,
        updated_at=user.updated_at
    ) for user in users]

@router.put("/users/{user_id}/location")
async def update_user_location(
    user_id: int,
    location_data: UserLocationUpdate,
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(admin_required)
):
    """사용자 위치 강제 변경"""
    result = await db.execute(select(MySQLUser).where(MySQLUser.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    user.current_latitude = location_data.latitude
    user.current_longitude = location_data.longitude
    user.updated_at = datetime.now()
    
    await db.commit()
    await db.refresh(user)
    
    return {"message": "사용자 위치가 성공적으로 업데이트되었습니다"}

@router.put("/users/{user_id}/admin")
async def toggle_admin_status(
    user_id: int,
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(admin_required)
):
    """사용자 관리자 권한 토글"""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="자신의 관리자 권한은 변경할 수 없습니다")
    
    result = await db.execute(select(MySQLUser).where(MySQLUser.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    user.is_admin = not user.is_admin
    user.updated_at = datetime.now()
    
    await db.commit()
    await db.refresh(user)
    
    return {"message": f"사용자 관리자 권한이 {'활성화' if user.is_admin else '비활성화'}되었습니다"}

@router.get("/alert-logs", response_model=List[AlertLogInfo])
async def get_alert_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = Query(None),
    days: int = Query(7, ge=1, le=365),
    alert_type: Optional[str] = Query(None),
    danger_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(admin_required)
):
    """알림 로그 조회"""
    start_date = datetime.now() - timedelta(days=days)
    
    # 조인 쿼리 실행
    query = select(AlertLog, MySQLUser).join(
        MySQLUser, AlertLog.user_id == MySQLUser.id
    ).where(AlertLog.created_at >= start_date)
    
    if user_id:
        query = query.where(AlertLog.user_id == user_id)
    if alert_type:
        query = query.where(AlertLog.alert_type == alert_type)
    if danger_type:
        query = query.where(AlertLog.danger_type == danger_type)
    
    result = await db.execute(
        query.order_by(AlertLog.created_at.desc()).offset(skip).limit(limit)
    )
    results = result.all()
    
    return [AlertLogInfo(
        id=log.id,
        user_id=log.user_id,
        user_email=user.email,
        user_username=user.username,
        alert_type=log.alert_type,
        danger_type=log.danger_type,
        danger_location=log.danger_location,
        danger_latitude=log.danger_latitude,
        danger_longitude=log.danger_longitude,
        user_latitude=log.user_latitude,
        user_longitude=log.user_longitude,
        distance_km=log.distance_km,
        news_title=log.news_title,
        is_sent=log.is_sent,
        error_message=log.error_message,
        created_at=log.created_at
    ) for log, user in results]

@router.delete("/alert-logs/{log_id}")
async def delete_alert_log(
    log_id: int,
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(admin_required)
):
    """알림 로그 삭제"""
    result = await db.execute(select(AlertLog).where(AlertLog.id == log_id))
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="알림 로그를 찾을 수 없습니다")
    
    await db.delete(log)
    await db.commit()
    
    return {"message": "알림 로그가 삭제되었습니다"}

@router.delete("/alert-logs")
async def clear_old_alert_logs(
    days: int = Query(30, ge=1),
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(admin_required)
):
    """오래된 알림 로그 일괄 삭제"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    result = await db.execute(
        select(AlertLog).where(AlertLog.created_at < cutoff_date)
    )
    logs_to_delete = result.scalars().all()
    deleted_count = len(logs_to_delete)
    
    for log in logs_to_delete:
        await db.delete(log)
    
    await db.commit()
    
    return {"message": f"{deleted_count}개의 오래된 알림 로그가 삭제되었습니다"}

@router.post("/send-notification")
async def send_admin_notification(
    notification_request: AdminNotificationRequest,
    db: AsyncSession = Depends(get_mysql_session),
    current_user: MySQLUser = Depends(get_current_admin_user)
):
    """관리자가 사용자들에게 알림을 발송합니다."""
    from ..services.alert_service import AlertService
    from ..services.email_service import EmailService
    from ..services.notification_service import notification_service
    
    alert_service = AlertService()
    email_service = EmailService()
    
    # 대상 사용자 선택
    target_users = []
    
    if notification_request.recipient_type == "all":
        # 모든 사용자
        result = await db.execute(select(MySQLUser))
        target_users = result.scalars().all()
        
    elif notification_request.recipient_type == "specific":
        # 특정 사용자들
        if not notification_request.user_ids:
            raise HTTPException(status_code=400, detail="사용자 ID 목록이 필요합니다")
        
        result = await db.execute(
            select(MySQLUser).where(MySQLUser.id.in_(notification_request.user_ids))
        )
        target_users = result.scalars().all()
        
    elif notification_request.recipient_type == "location_based":
        # 특정 위치 기반
        if not all([notification_request.location_latitude, 
                   notification_request.location_longitude, 
                   notification_request.radius_km]):
            raise HTTPException(status_code=400, detail="위치 정보가 필요합니다")
          # 위치가 있는 모든 사용자를 가져와서 거리 계산
        result = await db.execute(
            select(MySQLUser).where(
                MySQLUser.current_latitude.is_not(None),
                MySQLUser.current_longitude.is_not(None)
            )
        )
        all_users = result.scalars().all()        # 거리 계산으로 필터링
        for user in all_users:
            if (user.current_latitude is not None and 
                user.current_longitude is not None and
                notification_request.location_latitude is not None and
                notification_request.location_longitude is not None and
                notification_request.radius_km is not None):
                distance = alert_service._calculate_distance(
                    notification_request.location_latitude,
                    notification_request.location_longitude,
                    user.current_latitude,
                    user.current_longitude
                )
                if distance <= notification_request.radius_km:
                    target_users.append(user)
    
    if not target_users:
        raise HTTPException(status_code=404, detail="발송 대상 사용자가 없습니다")
    
    # 알림 발송
    sent_count = 0
    failed_count = 0
    
    for user in target_users:
        try:
            # 알림 로그 생성
            alert_log = AlertLog(
                user_id=user.id,
                alert_type=notification_request.alert_type,
                danger_type=notification_request.danger_type,
                danger_location=notification_request.location_name,
                danger_latitude=notification_request.location_latitude,
                danger_longitude=notification_request.location_longitude,
                user_latitude=user.current_latitude,
                user_longitude=user.current_longitude,
                distance_km=None,
                news_title=notification_request.title,
                is_sent=False,
                error_message=None
            )
              # 거리 계산 (위치 기반인 경우)
            if (notification_request.location_latitude and 
                notification_request.location_longitude and 
                user.current_latitude and user.current_longitude):
                alert_log.distance_km = alert_service._calculate_distance(
                    notification_request.location_latitude,
                    notification_request.location_longitude,
                    user.current_latitude,
                    user.current_longitude
                )
              # 이메일 발송
            email_sent = False
            if notification_request.alert_type in ["email", "both"]:
                subject = f"[{notification_request.danger_type.upper()}] {notification_request.title}"
                email_content = f"""
안녕하세요 {user.username}님,

관리자로부터 중요한 알림이 있습니다.

제목: {notification_request.title}
내용: {notification_request.message}

위치: {notification_request.location_name or '정보 없음'}

이 메시지는 시스템 관리자가 발송한 공지사항입니다.

Atlas 알림 시스템
"""
                try:
                    await email_service.send_email(user.email, subject, email_content)
                    email_sent = True
                except Exception as e:
                    print(f"이메일 발송 실패 (사용자 {user.id}): {e}")
            
            # 웹 알림 발송
            web_notification_sent = False
            if notification_request.alert_type in ["web", "both"]:
                try:
                    # 알림 타입에 따른 아이콘 결정
                    notification_type = "warning" if notification_request.danger_type in ["warning", "caution"] else "danger"
                    if notification_request.danger_type in ["info", "notice"]:
                        notification_type = "info"
                    
                    # 우선순위 결정
                    priority = "high" if notification_request.danger_type in ["emergency", "danger", "critical"] else "normal"
                    
                    web_notification_id = await notification_service.create_notification(
                        user_id=user.id,
                        notification_type=notification_type,
                        title=f"🚨 관리자 알림: {notification_request.title}",
                        message=notification_request.message,
                        data={
                            'source': 'admin',
                            'danger_type': notification_request.danger_type,
                            'location_name': notification_request.location_name,
                            'location_latitude': notification_request.location_latitude,
                            'location_longitude': notification_request.location_longitude,
                            'admin_user': current_user.username,
                            'sent_at': datetime.now().isoformat()
                        },
                        priority=priority
                    )
                    
                    if web_notification_id:
                        web_notification_sent = True
                        print(f"웹 알림 생성 성공 (사용자 {user.id}): {web_notification_id}")
                    else:
                        print(f"웹 알림 생성 실패 (사용자 {user.id})")
                        
                except Exception as e:
                    print(f"웹 알림 발송 실패 (사용자 {user.id}): {e}")
            
            # 적어도 하나의 알림이 성공했으면 성공으로 처리
            if email_sent or web_notification_sent or notification_request.alert_type == "log_only":
                alert_log.is_sent = True
                sent_count += 1
            else:
                alert_log.error_message = "모든 알림 발송 방법이 실패했습니다"
                failed_count += 1
            
        except Exception as e:
            alert_log.error_message = str(e)
            failed_count += 1
        
        # 알림 로그 저장
        db.add(alert_log)
    
    await db.commit()
    
    return {
        "message": "관리자 알림이 발송되었습니다",
        "total_recipients": len(target_users),
        "sent_count": sent_count,
        "failed_count": failed_count,
        "recipients": [{"id": user.id, "email": user.email, "username": user.username} for user in target_users]
    }
