import asyncio
import math
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.orm import Session, sessionmaker
from ..core.database import get_database, get_mysql_session
from ..models.news import News
from ..models.mysql_user import MySQLUser
from ..models.alert_log import AlertLog
from .geolocation import geolocation_service
from .email_service import EmailService
from .notification_service import notification_service
import logging

logger = logging.getLogger(__name__)

class AlertService:
    def __init__(self):
        # 영어 뉴스용 위험 키워드
        self.danger_keywords = {
            'crime': [
                'murder', 'killing', 'homicide', 'assassination', 'manslaughter',
                'robbery', 'burglary', 'theft', 'kidnapping', 'abduction',
                'rape', 'assault', 'attack', 'shooting', 'stabbing',
                'terrorism', 'terrorist', 'bomb', 'explosion', 'blast',
                'violence', 'violent crime', 'gang', 'drug trafficking',
                'serial killer', 'mass shooting', 'armed robbery'
            ],
            'natural_disaster': [
                'earthquake', 'tsunami', 'hurricane', 'typhoon', 'tornado',
                'flood', 'flooding', 'wildfire', 'fire', 'volcanic eruption',
                'landslide', 'avalanche', 'blizzard', 'drought', 'cyclone',
                'storm', 'severe weather', 'natural disaster', 'emergency',
                'evacuation', 'disaster zone'
            ],
            'public_safety': [
                'riot', 'protest', 'clash', 'civil unrest', 'demonstration',
                'lockdown', 'curfew', 'emergency alert', 'public safety',
                'security threat', 'danger', 'warning', 'alert',
                'hazardous', 'unsafe', 'incident', 'accident'
            ]
        }
        
        # 위험도별 가중치
        self.severity_weights = {
            'high': ['murder', 'terrorism', 'earthquake', 'tsunami', 'mass shooting'],
            'medium': ['robbery', 'assault', 'flood', 'fire', 'riot'],
            'low': ['theft', 'protest', 'accident']
        }

    async def check_dangerous_news(self, user_lat: float, user_lng: float, radius_km: int = 50) -> List[Dict[str, Any]]:
        """사용자 위치 근처의 위험 뉴스 체크"""
        try:
            db = await get_database()
            
            # 최근 24시간 뉴스 조회
            cutoff_time = datetime.now() - timedelta(hours=24)
            cutoff_str = cutoff_time.strftime("%Y-%m-%d")
            
            news_cursor = db.news.find({
                "$or": [
                    {"published": {"$gte": cutoff_str}},
                    {"date": {"$gte": cutoff_str}}
                ]
            })
            
            dangerous_news = []
            
            async for news_doc in news_cursor:
                try:
                    # 위험 키워드 체크
                    danger_info = self._analyze_danger_level(news_doc)
                    if danger_info['is_dangerous']:
                        # 뉴스 위치와 사용자 위치 거리 계산
                        if await self._is_within_radius(news_doc, user_lat, user_lng, radius_km):
                            news_doc['danger_info'] = danger_info
                            dangerous_news.append(news_doc)
                
                except Exception as e:
                    logger.warning(f"뉴스 분석 중 오류: {e}")
                    continue
            
            return dangerous_news
            
        except Exception as e:
            logger.error(f"위험 뉴스 체크 중 오류: {e}")
            return []

    def _analyze_danger_level(self, news: Dict[str, Any]) -> Dict[str, Any]:
        """뉴스의 위험도 분석"""
        text = f"{news.get('title', '')} {news.get('content', '')}".lower()
        
        danger_info = {
            'is_dangerous': False,
            'severity': 'low',
            'categories': [],
            'matched_keywords': []
        }
        
        # 카테고리별 키워드 매칭
        for category, keywords in self.danger_keywords.items():
            matched = [kw for kw in keywords if kw in text]
            if matched:
                danger_info['categories'].append(category)
                danger_info['matched_keywords'].extend(matched)
                danger_info['is_dangerous'] = True
        
        # 위험도 결정
        if danger_info['is_dangerous']:
            for severity, keywords in self.severity_weights.items():
                if any(kw in danger_info['matched_keywords'] for kw in keywords):
                    danger_info['severity'] = severity
                    break
        
        return danger_info

    async def _is_within_radius(self, news: Dict[str, Any], user_lat: float, user_lng: float, radius_km: int) -> bool:
        """뉴스 발생 위치가 사용자 반경 내에 있는지 확인"""
        locations = news.get('locations', [])
        
        # locations가 없으면 title이나 content에서 지명 추출 시도
        if not locations:
            locations = self._extract_locations_from_text(news.get('title', '') + ' ' + news.get('content', ''))
        
        for location in locations:
            try:
                geo_result = geolocation_service.geocode(location)
                if geo_result.get('success'):
                    news_lat = geo_result['coordinates']['latitude']
                    news_lng = geo_result['coordinates']['longitude']
                    
                    # 거리 계산 (하버사인 공식)
                    distance = self._calculate_distance(user_lat, user_lng, news_lat, news_lng)
                    if distance <= radius_km:
                        return True
            except Exception as e:
                logger.warning(f"위치 확인 중 오류 ({location}): {e}")
                continue
        
        return False

    def _extract_locations_from_text(self, text: str) -> List[str]:
        """텍스트에서 지명 추출 (간단한 패턴 매칭)"""
        # 대문자로 시작하는 연속된 단어들을 지명으로 간주
        location_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
        potential_locations = re.findall(location_pattern, text)
        
        # 일반적인 지명 패턴 필터링
        common_places = ['City', 'County', 'State', 'Province', 'District', 'Region']
        locations = []
        
        for loc in potential_locations:
            # 최소 길이 체크 및 일반적인 지명 패턴 포함
            if len(loc) > 2 and (any(place in loc for place in common_places) or len(loc.split()) > 1):
                locations.append(loc)
        
        return list(set(locations))  # 중복 제거

    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """두 지점 간의 거리를 계산 (하버사인 공식, km 단위)"""
        R = 6371  # 지구 반지름 (km)
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlng/2) * math.sin(dlng/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance

    async def log_alert(self, user_id: int, alert_type: str, danger_type: str, 
                       news_info: Dict[str, Any], user_lat: Optional[float] = None, 
                       user_lng: Optional[float] = None, is_sent: bool = True, 
                       error_message: Optional[str] = None) -> None:
        """알림 로그를 데이터베이스에 저장"""
        try:
            # 동기 방식으로 MySQL 세션 사용
            import sys
            sys.path.append('..')
            from sqlalchemy import create_engine
            from app.core.config import settings
            
            # 동기 엔진 생성
            engine = create_engine(settings.mysql_url.replace('+aiomysql', ''))
            SessionLocal = sessionmaker(bind=engine)
            
            with SessionLocal() as db:
                alert_log = AlertLog(
                    user_id=user_id,
                    alert_type=alert_type,
                    danger_type=danger_type,
                    danger_location=news_info.get('location', ''),
                    danger_latitude=news_info.get('latitude'),
                    danger_longitude=news_info.get('longitude'),
                    user_latitude=user_lat,
                    user_longitude=user_lng,
                    distance_km=news_info.get('distance'),
                    news_title=news_info.get('title', ''),
                    news_content=news_info.get('content', '')[:1000] if news_info.get('content') else None,
                    is_sent=is_sent,
                    error_message=error_message
                )
                db.add(alert_log)
                db.commit()
                logger.info(f"알림 로그 저장 완료: user_id={user_id}, type={alert_type}")
                
        except Exception as e:
            logger.error(f"알림 로그 저장 실패: {e}")

    async def send_danger_alert(self, user: MySQLUser, news_info: Dict[str, Any]) -> bool:
        """위험 알림을 사용자에게 발송 (이메일 + 웹 알림)"""
        try:
            email_service = EmailService()
            
            # 이메일 발송
            email_sent = await email_service.send_alert_email(
                user.email, 
                news_info['danger_info']['categories'][0],
                news_info.get('title', '위험 상황 발생'),
                news_info.get('location', '위치 불명'),
                news_info.get('distance', 0)
            )
            
            # 웹 알림 발송
            web_notification_id = await notification_service.send_danger_notification(
                user_id=user.id,
                news_info=news_info
            )
            
            # 알림 로그 저장
            await self.log_alert(
                user_id=user.id,
                alert_type='email+web',
                danger_type=news_info['danger_info']['categories'][0],
                news_info=news_info,
                user_lat=user.current_latitude,
                user_lng=user.current_longitude,
                is_sent=email_sent and bool(web_notification_id),
                error_message=None if (email_sent and web_notification_id) else "일부 알림 발송 실패"
            )
            
            return email_sent or bool(web_notification_id)  # 둘 중 하나라도 성공하면 True
            
        except Exception as e:
            logger.error(f"위험 알림 발송 실패: {e}")
            
            # 실패 로그 저장
            await self.log_alert(
                user_id=user.id,
                alert_type='email+web',
                danger_type=news_info['danger_info']['categories'][0] if news_info.get('danger_info') else 'unknown',
                news_info=news_info,
                user_lat=user.current_latitude,
                user_lng=user.current_longitude,
                is_sent=False,
                error_message=str(e)
            )
            
            return False


# 싱글톤 인스턴스
alert_service = AlertService()    