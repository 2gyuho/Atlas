from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..core.security import get_current_user
from ..models.mysql_user import MySQLUser
from ..services.notification_service import notification_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# Pydantic 모델 정의
class NotificationResponse(BaseModel):
    id: str
    user_id: int
    type: str
    title: str
    message: str
    data: Dict[str, Any]
    priority: str
    created_at: str
    read: bool
    delivered: bool

class NotificationCreate(BaseModel):
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    priority: str = 'normal'

class MarkReadRequest(BaseModel):
    notification_id: str

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="읽지 않은 알림만 조회"),
    limit: int = Query(50, ge=1, le=100, description="조회할 알림 개수"),
    current_user: MySQLUser = Depends(get_current_user)
):
    """사용자의 알림 목록 조회"""
    try:
        notifications = await notification_service.get_user_notifications(
            user_id=current_user.id,
            unread_only=unread_only,
            limit=limit
        )
        
        return notifications
        
    except Exception as e:
        logger.error(f"알림 조회 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림을 조회하는 중 오류가 발생했습니다."
        )

@router.get("/unread-count")
async def get_unread_count(
    current_user: MySQLUser = Depends(get_current_user)
):
    """읽지 않은 알림 개수 조회"""
    try:
        count = await notification_service.get_unread_count(current_user.id)
        return {"unread_count": count}
        
    except Exception as e:
        logger.error(f"읽지 않은 알림 개수 조회 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="읽지 않은 알림 개수를 조회하는 중 오류가 발생했습니다."
        )

@router.post("/mark-read")
async def mark_notification_as_read(
    request: MarkReadRequest,
    current_user: MySQLUser = Depends(get_current_user)
):
    """알림을 읽음으로 표시"""
    try:
        success = await notification_service.mark_notification_as_read(
            user_id=current_user.id,
            notification_id=request.notification_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="알림을 찾을 수 없습니다."
            )
        
        return {"success": True, "message": "알림이 읽음으로 표시되었습니다."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"알림 읽음 표시 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림을 읽음으로 표시하는 중 오류가 발생했습니다."
        )

@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: MySQLUser = Depends(get_current_user)
):
    """모든 알림을 읽음으로 표시"""
    try:
        success = await notification_service.mark_all_as_read(current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="알림을 읽음으로 표시하는 중 오류가 발생했습니다."
            )
        
        return {"success": True, "message": "모든 알림이 읽음으로 표시되었습니다."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"모든 알림 읽음 표시 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="모든 알림을 읽음으로 표시하는 중 오류가 발생했습니다."
        )

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: MySQLUser = Depends(get_current_user)
):
    """알림 삭제"""
    try:
        success = await notification_service.delete_notification(
            user_id=current_user.id,
            notification_id=notification_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="알림을 찾을 수 없습니다."
            )
        
        return {"success": True, "message": "알림이 삭제되었습니다."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"알림 삭제 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="알림을 삭제하는 중 오류가 발생했습니다."
        )

@router.post("/test")
async def create_test_notification(
    current_user: MySQLUser = Depends(get_current_user)
):
    """테스트 알림 생성 (개발/테스트용)"""
    try:
        notification_id = await notification_service.send_info_notification(
            user_id=current_user.id,
            title="🧪 테스트 알림",
            message="웹 알림 시스템이 정상적으로 작동하고 있습니다.",
            data={
                "test": True,
                "timestamp": "2024-01-01T12:00:00",
                "source": "system_test"
            }
        )
        
        if not notification_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="테스트 알림 생성에 실패했습니다."
            )
        
        return {
            "success": True,
            "message": "테스트 알림이 생성되었습니다.",
            "notification_id": notification_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"테스트 알림 생성 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="테스트 알림을 생성하는 중 오류가 발생했습니다."
        )
