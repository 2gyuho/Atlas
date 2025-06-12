import asyncio
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any
from sqlalchemy import text

from ..core.database import get_mysql_session
from ..models.mysql_user import MySQLUser
from ..models.alert_log import AlertLog
from .alert_service import alert_service
from .email_service import email_service

logger = logging.getLogger(__name__)

class MonitoringService:
    def __init__(self):
        self.is_running = False
        self.check_interval = 300  # 5분마다 체크
        self.user_alert_history = {}  # 사용자별 마지막 알림 시간
        self.min_alert_interval = 3600  # 1시간마다만 알림
        
    async def start_monitoring(self):
        """위험 알림 모니터링 시작"""
        logger.info("위험 알림 모니터링 시작")
        self.is_running = True
        
        while self.is_running:
            try:
                await self._check_all_users()
                # 5분 대기 (중단 가능하도록 1초씩 체크)
                for i in range(self.check_interval):
                    if not self.is_running:
                        break
                    await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"모니터링 오류: {e}")                
                await asyncio.sleep(60)  # 오류 시 1분 대기
    
    def stop_monitoring(self):
        """위험 알림 모니터링 중지"""
        logger.info("위험 알림 모니터링 중지")
        self.is_running = False
    
    async def _check_all_users(self):
        """모든 활성 사용자의 위험 상황 체크"""
        try:
            # 비동기 MySQL 세션 사용
            async for db in get_mysql_session():
                try:
                    # 알림이 활성화되고 위치 정보가 있는 사용자들만 조회
                    result = await db.execute(
                        text("SELECT * FROM users WHERE alert_enabled = TRUE AND current_latitude IS NOT NULL AND current_longitude IS NOT NULL")
                    )
                    users = result.fetchall()
                    
                    logger.info(f"위험 모니터링 대상 사용자 수: {len(users)}")
                    
                    for user_row in users:
                        try:
                            # 최근 알림 확인 (중복 방지)
                            if self._should_skip_user(user_row.id):
                                continue
                            
                            # Row를 딕셔너리로 변환
                            user_dict = {
                                'id': user_row.id,
                                'email': user_row.email,
                                'current_latitude': user_row.current_latitude,
                                'current_longitude': user_row.current_longitude,
                                'alert_enabled': user_row.alert_enabled,
                                'alert_radius': getattr(user_row, 'alert_radius_km', 50)
                            }
                            
                            # 사용자 주변 위험 체크
                            danger_result = await self._check_user_dangers(user_dict)
                            
                            if danger_result['dangerous_news_count'] > 0:
                                logger.info(f"사용자 {user_dict['email']}에게 위험 알림 발송: {danger_result['dangerous_news_count']}건")
                                
                                # 알림 발송
                                success = await self._send_danger_alert(user_dict, danger_result['dangerous_news'])
                                
                                if success:
                                    # 알림 히스토리 업데이트
                                    self.user_alert_history[user_dict['id']] = datetime.now()
                            
                        except Exception as e:
                            logger.error(f"사용자 {user_row.id} 체크 오류: {e}")
                            
                    break  # async for 문 탈출
                except Exception as e:
                    logger.error(f"사용자 쿼리 오류: {e}")
                    break
                        
        except Exception as e:
            logger.error(f"전체 사용자 체크 오류: {e}")
    
    def _should_skip_user(self, user_id: int) -> bool:
        """사용자를 건너뛸지 확인 (중복 알림 방지)"""
        if user_id not in self.user_alert_history:
            return False
            
        last_alert_time = self.user_alert_history[user_id]
        time_diff = (datetime.now() - last_alert_time).total_seconds()
        
        # 최소 간격보다 짧으면 건너뛰기
        return time_diff < self.min_alert_interval
    
    async def _check_user_dangers(self, user_dict: Dict[str, Any]) -> Dict[str, Any]:
        """특정 사용자 주변의 위험 상황 체크"""
        try:
            # AlertService를 사용하여 주변 위험 뉴스 검색
            dangerous_news = await alert_service.check_dangerous_news_near_location(
                latitude=user_dict['current_latitude'],
                longitude=user_dict['current_longitude'],
                radius_km=user_dict.get('alert_radius', 50),
                hours_back=24  # 최근 24시간 뉴스만
            )
            
            return {
                "dangerous_news_count": len(dangerous_news),
                "dangerous_news": dangerous_news
            }
            
        except Exception as e:
            logger.error(f"사용자 {user_dict['id']} 위험 체크 오류: {e}")
            return {
                "dangerous_news_count": 0,
                "dangerous_news": []
            }
    
    async def _send_danger_alert(self, user_dict: Dict[str, Any], dangerous_news: List[Dict]) -> bool:
        """사용자에게 위험 알림 발송"""
        try:
            # 이메일 알림 발송
            email_success = await self._send_email_alert(user_dict, dangerous_news)
            
            # 알림 로그 저장
            await self._save_alert_log(user_dict, dangerous_news, email_success)
            
            return email_success
            
        except Exception as e:
            logger.error(f"사용자 {user_dict['email']}에게 알림 발송 실패: {e}")
            return False
    
    async def _send_email_alert(self, user_dict: Dict[str, Any], dangerous_news: List[Dict]) -> bool:
        """이메일 위험 알림 발송"""
        try:
            # 위험도별 분류
            high_danger = [news for news in dangerous_news if news.get('danger_info', {}).get('severity') == 'high']
            total_count = len(dangerous_news)
            high_count = len(high_danger)
            
            if high_count > 0:
                subject = f"🚨 긴급 위험 알림 - 주변에 {high_count}건의 고위험 상황 발생"
            else:
                subject = f"⚠️ 위험 알림 - 주변에 {total_count}건의 위험 상황 발생"
            
            # 간단한 이메일 내용 생성
            content = f"""
            <h2>🚨 위험 알림</h2>
            <p>귀하의 주변에서 {total_count}건의 위험 상황이 감지되었습니다.</p>
            <p>위치: {user_dict['current_latitude']:.4f}, {user_dict['current_longitude']:.4f}</p>
            <p>반경: {user_dict.get('alert_radius', 50)}km</p>
            <p>즉시 주변 상황을 확인하시고 안전에 유의하시기 바랍니다.</p>
            """
            
            # 이메일 발송
            success = await email_service.send_email(
                to_email=user_dict['email'],
                subject=subject,
                content=content
            )
            
            if success:
                logger.info(f"사용자 {user_dict['email']}에게 위험 알림 이메일 발송 성공")
            else:
                logger.error(f"사용자 {user_dict['email']}에게 위험 알림 이메일 발송 실패")
            
            return success
            
        except Exception as e:
            logger.error(f"이메일 알림 발송 오류: {e}")
            return False
    
    async def _save_alert_log(self, user_dict: Dict[str, Any], dangerous_news: List[Dict], 
                            email_success: bool):
        """알림 로그 저장"""
        try:
            async for db in get_mysql_session():
                try:
                    alert_log = AlertLog(
                        user_id=user_dict['id'],
                        alert_type="danger_detection",
                        danger_type="monitoring",
                        danger_location=f"반경 {user_dict.get('alert_radius', 50)}km",
                        user_latitude=user_dict['current_latitude'],
                        user_longitude=user_dict['current_longitude'],
                        news_title=f"{len(dangerous_news)}건의 위험 상황 감지",
                        is_sent=email_success,
                        error_message=None if email_success else "이메일 발송 실패"
                    )
                    
                    db.add(alert_log)
                    await db.commit()
                    break  # async for 문 탈출
                except Exception as e:
                    logger.error(f"알림 로그 저장 중 오류: {e}")
                    break
                    
        except Exception as e:
            logger.error(f"알림 로그 저장 실패: {e}")
    
    async def check_user_now(self, user_id: int):
        """특정 사용자의 즉시 위험 체크"""
        try:
            async for db in get_mysql_session():
                try:
                    result = await db.execute(
                        text("SELECT * FROM users WHERE id = :user_id"),
                        {"user_id": user_id}
                    )
                    user_row = result.fetchone()
                    
                    if not user_row:
                        return {"error": "사용자를 찾을 수 없습니다"}
                    
                    if not user_row.current_latitude or not user_row.current_longitude:
                        return {"error": "사용자의 위치 정보가 없습니다"}
                    
                    logger.info(f"사용자 {user_row.email}의 즉시 위험 체크")
                    
                    user_dict = {
                        'id': user_row.id,
                        'email': user_row.email,
                        'current_latitude': user_row.current_latitude,
                        'current_longitude': user_row.current_longitude,
                        'alert_radius': getattr(user_row, 'alert_radius_km', 50)
                    }
                    
                    danger_result = await self._check_user_dangers(user_dict)
                    
                    return {
                        "success": True,
                        "message": "위험 체크 완료",
                        "user_location": {
                            "latitude": user_dict['current_latitude'],
                            "longitude": user_dict['current_longitude'],
                            "radius_km": user_dict['alert_radius']
                        },
                        "dangerous_news_count": danger_result['dangerous_news_count'],
                        "dangerous_news": danger_result['dangerous_news']
                    }
                except Exception as e:
                    logger.error(f"사용자 체크 중 오류: {e}")
                    return {"error": f"체크 실패: {str(e)}"}
                
        except Exception as e:
            logger.error(f"사용자 {user_id} 즉시 체크 오류: {e}")
            return {"error": f"체크 실패: {str(e)}"}
    
    def get_monitoring_status(self) -> Dict[str, Any]:
        """모니터링 상태 조회"""
        return {
            "is_running": self.is_running,
            "check_interval": self.check_interval,
            "min_alert_interval": self.min_alert_interval,
            "active_users_count": len(self.user_alert_history),
            "last_check_time": datetime.now().isoformat() if self.is_running else None
        }

# 전역 인스턴스
monitoring_service = MonitoringService()
