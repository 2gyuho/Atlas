from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.orm import Session
from ..core.database import get_database, get_mysql_session
from ..models.mysql_user import MySQLUser
import logging
import asyncio

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # 사용자별 알림 저장소 (메모리 기반, 실제 서버에서는 Redis 등 사용 권장)
        self.user_notifications = {}
        # 웹소켓 연결 저장소 (향후 웹소켓 구현 시 사용)
        self.websocket_connections = {}
    
    async def create_notification(self, user_id: int, notification_type: str, 
                                title: str, message: str, data: Optional[Dict] = None,
                                priority: str = 'normal') -> str:
        """새 알림 생성"""
        try:
            notification_id = f"{user_id}_{int(datetime.now().timestamp())}"
            notification = {
                'id': notification_id,
                'user_id': user_id,
                'type': notification_type,  # 'danger', 'info', 'warning', 'success'
                'title': title,
                'message': message,
                'data': data or {},
                'priority': priority,  # 'high', 'normal', 'low'
                'created_at': datetime.now().isoformat(),
                'read': False,
                'delivered': False
            }
            
            # 사용자별 알림 목록에 추가
            if user_id not in self.user_notifications:
                self.user_notifications[user_id] = []
            
            self.user_notifications[user_id].append(notification)
            
            # 최근 100개만 유지 (메모리 관리)
            if len(self.user_notifications[user_id]) > 100:
                self.user_notifications[user_id] = self.user_notifications[user_id][-100:]
            
            logger.info(f"새 알림 생성: user_id={user_id}, type={notification_type}, title={title}")
            return notification_id
            
        except Exception as e:
            logger.error(f"알림 생성 실패: {e}")
            return None
    
    async def get_user_notifications(self, user_id: int, unread_only: bool = False, 
                                   limit: int = 50) -> List[Dict]:
        """사용자의 알림 목록 조회"""
        try:
            notifications = self.user_notifications.get(user_id, [])
            
            if unread_only:
                notifications = [n for n in notifications if not n['read']]
            
            # 최신 순으로 정렬
            notifications.sort(key=lambda x: x['created_at'], reverse=True)
            
            return notifications[:limit]
            
        except Exception as e:
            logger.error(f"알림 조회 실패: {e}")
            return []
    
    async def mark_notification_as_read(self, user_id: int, notification_id: str) -> bool:
        """알림을 읽음으로 표시"""
        try:
            notifications = self.user_notifications.get(user_id, [])
            
            for notification in notifications:
                if notification['id'] == notification_id:
                    notification['read'] = True
                    notification['read_at'] = datetime.now().isoformat()
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"알림 읽음 표시 실패: {e}")
            return False
    
    async def mark_all_as_read(self, user_id: int) -> bool:
        """사용자의 모든 알림을 읽음으로 표시"""
        try:
            notifications = self.user_notifications.get(user_id, [])
            
            for notification in notifications:
                if not notification['read']:
                    notification['read'] = True
                    notification['read_at'] = datetime.now().isoformat()
            
            return True
            
        except Exception as e:
            logger.error(f"모든 알림 읽음 표시 실패: {e}")
            return False
    
    async def get_unread_count(self, user_id: int) -> int:
        """읽지 않은 알림 개수 조회"""
        try:
            notifications = self.user_notifications.get(user_id, [])
            return len([n for n in notifications if not n['read']])
            
        except Exception as e:
            logger.error(f"읽지 않은 알림 개수 조회 실패: {e}")
            return 0
    
    async def delete_notification(self, user_id: int, notification_id: str) -> bool:
        """알림 삭제"""
        try:
            notifications = self.user_notifications.get(user_id, [])
            
            for i, notification in enumerate(notifications):
                if notification['id'] == notification_id:
                    del notifications[i]
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"알림 삭제 실패: {e}")
            return False
    
    async def cleanup_old_notifications(self, days: int = 30) -> int:
        """오래된 알림 정리"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            cleaned_count = 0
            
            for user_id, notifications in self.user_notifications.items():
                initial_count = len(notifications)
                self.user_notifications[user_id] = [
                    n for n in notifications 
                    if datetime.fromisoformat(n['created_at']) > cutoff_date
                ]
                cleaned_count += initial_count - len(self.user_notifications[user_id])
            
            logger.info(f"오래된 알림 {cleaned_count}개 정리 완료")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"알림 정리 실패: {e}")
            return 0
    
    async def send_danger_notification(self, user_id: int, news_info: Dict[str, Any]) -> str:
        """위험 알림 웹 알림 생성"""
        try:
            danger_type = news_info.get('danger_info', {}).get('categories', ['unknown'])[0]
            location = news_info.get('location', '위치 불명')
            distance = news_info.get('distance', 0)
            
            title = f"⚠️ 위험 알림: {danger_type.upper()}"
            message = f"{location}에서 {distance:.1f}km 거리에 위험 상황이 발생했습니다."
            
            data = {
                'danger_type': danger_type,
                'location': location,
                'distance': distance,
                'news_title': news_info.get('title', ''),
                'news_content': news_info.get('content', '')[:200] + '...' if news_info.get('content') else '',
                'severity': news_info.get('danger_info', {}).get('severity', 'medium')
            }
            
            notification_id = await self.create_notification(
                user_id=user_id,
                notification_type='danger',
                title=title,
                message=message,
                data=data,
                priority='high'
            )
            
            return notification_id
            
        except Exception as e:
            logger.error(f"위험 알림 생성 실패: {e}")
            return None
    
    async def send_info_notification(self, user_id: int, title: str, message: str, 
                                   data: Optional[Dict] = None) -> str:
        """일반 정보 알림 생성"""
        try:
            notification_id = await self.create_notification(
                user_id=user_id,
                notification_type='info',
                title=title,
                message=message,
                data=data,
                priority='normal'
            )
            
            return notification_id
            
        except Exception as e:
            logger.error(f"정보 알림 생성 실패: {e}")
            return None

# 싱글톤 인스턴스
notification_service = NotificationService()
