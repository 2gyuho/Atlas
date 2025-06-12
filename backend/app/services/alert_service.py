import asyncio
import math
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId
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

    def _convert_objectid_to_str(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """MongoDB 문서의 ObjectId를 문자열로 변환"""
        if isinstance(doc, dict):
            converted = {}
            for key, value in doc.items():
                if isinstance(value, ObjectId):
                    converted[key] = str(value)
                elif isinstance(value, dict):
                    converted[key] = self._convert_objectid_to_str(value)
                elif isinstance(value, list):
                    converted[key] = [self._convert_objectid_to_str(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item for item in value]
                else:
                    converted[key] = value
            return converted
        return doc

    async def check_dangerous_news_near_location(self, latitude: float, longitude: float,
                                                radius_km: int = 50, hours_back: int = 24) -> List[Dict[str, Any]]:
        """특정 위치 근처의 위험 뉴스 체크 (MonitoringService용)"""
        try:
            db = get_database()
            if db is None:
                logger.error("MongoDB 연결 실패")
                return []
            # 지정된 시간 전까지의 뉴스 조회
            cutoff_time = datetime.now() - timedelta(hours=hours_back)
            cutoff_str = cutoff_time.strftime("%Y-%m-%d")
            
            # MongoDB에서 최근 뉴스 검색
            news_collection = db.news
            if news_collection is None:
                logger.error("뉴스 컬렉션을 찾을 수 없습니다")
                return []
            
            news_cursor = news_collection.find({
                "$or": [
                    {"published": {"$gte": cutoff_str}},
                    {"date": {"$gte": cutoff_str}},
                    {"created_at": {"$gte": cutoff_time}}
                ]
            }).limit(1000)  # 최대 1000개로 제한
            
            dangerous_news = []
            
            # MongoDB 비동기 커서를 리스트로 변환
            news_docs = await news_cursor.to_list(length=None)
            
            for news_doc in news_docs:
                try:
                    # 위험 키워드 분석
                    danger_info = self._analyze_danger_level(news_doc)
                    
                    if danger_info['is_dangerous']:
                        # 위치 기반 필터링
                        within_radius = await self._is_within_radius(news_doc, latitude, longitude, radius_km)
                        if within_radius:
                            # 뉴스에 위험 정보 추가
                            news_doc['danger_info'] = danger_info
                            
                            # 거리 정보 추가 (옵션)
                            try:
                                distance = await self._calculate_news_distance(news_doc, latitude, longitude)
                                if distance is not None:
                                    news_doc['distance_km'] = round(distance, 2)
                            except Exception as e:
                                logger.warning(f"거리 계산 실패: {e}")
                            
                            # ObjectId를 문자열로 변환
                            serializable_doc = self._convert_objectid_to_str(news_doc)
                            dangerous_news.append(serializable_doc)
                            
                except Exception as e:
                    logger.warning(f"뉴스 분석 중 오류: {e}")
                    continue
            
            # 위험도 및 거리순으로 정렬
            dangerous_news.sort(key=lambda x: (
                -self._get_severity_score(x.get('danger_info', {}).get('severity', 'low')),
                x.get('distance_km', float('inf'))
            ))
            
            logger.info(f"위치 ({latitude:.4f}, {longitude:.4f}) 주변 {radius_km}km에서 {len(dangerous_news)}건의 위험 뉴스 발견")
            return dangerous_news
            
        except Exception as e:
            logger.error(f"위험 뉴스 검색 중 오류: {e}")
            return []

    def _get_severity_score(self, severity: str) -> int:
        """위험도를 숫자로 변환"""
        severity_scores = {'high': 3, 'medium': 2, 'low': 1}
        return severity_scores.get(severity, 0)

    async def _calculate_news_distance(self, news_doc: Dict, user_lat: float, user_lng: float) -> Optional[float]:
        """뉴스와 사용자 위치 간의 거리 계산"""
        try:
            # 뉴스에서 위치 정보 추출
            locations = news_doc.get('locations', [])
            
            # locations가 없으면 텍스트에서 추출
            if not locations:
                text = f"{news_doc.get('title', '')} {news_doc.get('content', '')}"
                locations = self._extract_locations_from_text(text)
            
            if not locations:
                return None
            
            # 가장 가까운 위치의 거리 반환
            min_distance = float('inf')
            
            for location in locations[:3]:  # 최대 3개 위치만 확인
                try:
                    geo_result = geolocation_service.geocode(location)
                    if geo_result.get('success'):
                        news_lat = geo_result['coordinates']['latitude']
                        news_lng = geo_result['coordinates']['longitude']
                        distance = self._calculate_distance(user_lat, user_lng, news_lat, news_lng)
                        min_distance = min(min_distance, distance)
                except Exception:
                    continue
            
            return min_distance if min_distance != float('inf') else None
            
        except Exception as e:
            logger.warning(f"뉴스 거리 계산 실패: {e}")
            return None

    async def check_alerts_for_user(self, user: MySQLUser) -> List[Dict[str, Any]]:
        """특정 사용자에 대한 위험 알림 체크"""
        try:
            if not user.current_latitude or not user.current_longitude:
                logger.info(f"사용자 {user.id}의 위치 정보가 없습니다")
                return []
            
            if not user.alert_enabled:
                logger.debug(f"사용자 {user.id}는 알림이 비활성화되어 있습니다")
                return []
            
            # 사용자 위치 주변의 위험 뉴스 검색
            danger_radius = user.alert_radius or 50  # 기본 50km
            dangerous_news = await self.check_dangerous_news_near_location(
                user.current_latitude, 
                user.current_longitude, 
                danger_radius
            )
            
            if dangerous_news:
                logger.info(f"사용자 {user.id} 주변에서 {len(dangerous_news)}건의 위험 뉴스 발견")
            
            return dangerous_news
            
        except Exception as e:
            logger.error(f"사용자 {user.id} 알림 체크 실패: {e}")
            return []

    async def _is_within_radius(self, news_doc: Dict, user_lat: float, user_lng: float, radius_km: int) -> bool:
        """뉴스가 사용자 위치 반경 내에 있는지 확인"""
        try:
            # 뉴스에서 위치 정보 추출
            locations = news_doc.get('locations', [])
            
            # locations가 없으면 텍스트에서 위치 추출
            if not locations:
                text = f"{news_doc.get('title', '')} {news_doc.get('content', '')}"
                locations = self._extract_locations_from_text(text)
            
            # 위치 정보가 없으면 반경 내로 간주 (보수적 접근)
            if not locations:
                return True
            
            # 하나라도 반경 내에 있으면 True
            for location in locations[:5]:  # 최대 5개 위치만 확인
                try:
                    geo_result = geolocation_service.geocode(location)
                    if geo_result.get('success'):
                        news_lat = geo_result['coordinates']['latitude']
                        news_lng = geo_result['coordinates']['longitude']
                        distance = self._calculate_distance(user_lat, user_lng, news_lat, news_lng)
                        
                        if distance <= radius_km:
                            return True
                except Exception:
                    continue
            
            return False
            
        except Exception as e:
            logger.warning(f"반경 체크 실패: {e}")
            return True  # 오류 시 보수적으로 True 반환

    def _extract_locations_from_text(self, text: str) -> List[str]:
        """텍스트에서 위치명 추출"""
        # 간단한 위치 추출 로직 (나중에 NLP로 개선 가능)
        location_patterns = [
            r'\b[A-Z][a-z]+ (?:City|County|State|Province|District)\b',
            r'\b[A-Z][a-z]+ (?:Street|Road|Avenue|Boulevard)\b',
            r'\b(?:Seoul|Busan|Incheon|Daegu|Daejeon|Gwangju|Ulsan|Suwon|Goyang|Yongin)\b',
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*,\s*[A-Z]{2}\b'  # City, State
        ]
        
        locations = []
        for pattern in location_patterns:
            matches = re.findall(pattern, text)
            locations.extend(matches)
        
        return list(set(locations))  # 중복 제거

    def _analyze_danger_level(self, news_doc: Dict) -> Dict[str, Any]:
        """뉴스의 위험도를 분석"""
        try:
            title = news_doc.get('title', '').lower()
            content = news_doc.get('content', '').lower()
            text = f"{title} {content}"
            
            danger_info = {
                'is_dangerous': False,
                'categories': [],
                'severity': 'low',
                'keywords_found': []
            }
            
            # 각 카테고리별 키워드 검색
            for category, keywords in self.danger_keywords.items():
                found_keywords = []
                for keyword in keywords:
                    if keyword.lower() in text:
                        found_keywords.append(keyword)
                
                if found_keywords:
                    danger_info['categories'].append(category)
                    danger_info['keywords_found'].extend(found_keywords)
            
            # 위험 뉴스 판단
            if danger_info['categories']:
                danger_info['is_dangerous'] = True
                
                # 위험도 계산
                high_keywords = set(self.severity_weights['high'])
                medium_keywords = set(self.severity_weights['medium'])
                found_keywords_set = set(danger_info['keywords_found'])
                
                if found_keywords_set & high_keywords:
                    danger_info['severity'] = 'high'
                elif found_keywords_set & medium_keywords:
                    danger_info['severity'] = 'medium'
                else:
                    danger_info['severity'] = 'low'
            
            return danger_info
            
        except Exception as e:
            logger.warning(f"위험도 분석 실패: {e}")
            return {'is_dangerous': False, 'categories': [], 'severity': 'low', 'keywords_found': []}

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
            # 비동기 MySQL 세션 사용
            async for db in get_mysql_session():
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
                await db.commit()
                logger.info(f"알림 로그 저장 완료: user_id={user_id}, type={alert_type}")
                break  # async for 문 탈출
                
        except Exception as e:
            logger.error(f"알림 로그 저장 실패: {e}")    
    async def send_danger_alert(self, user: MySQLUser, news_info: Dict[str, Any]) -> bool:
        """위험 알림을 사용자에게 발송 (이메일 + 웹 알림)"""
        try:
            email_service = EmailService()
            
            # 위치 정보 생성 (더 읽기 쉽게)
            if user.current_latitude and user.current_longitude:
                user_location = f"서울, 대한민국 ({user.current_latitude:.4f}, {user.current_longitude:.4f})"
            else:
                user_location = "위치 불명"
            
            # 이메일 발송
            print(f"🔥 이메일 발송 시도: {user.email}")
            email_sent = await email_service.send_alert_email(
                user.email, 
                [news_info],  # 리스트로 전달
                user_location
            )
            print(f"📧 이메일 발송 결과: {'성공' if email_sent else '실패'}")
            
            # 웹 알림 발송
            print(f"🔔 웹 알림 발송 시도: 사용자 {user.id}")
            web_notification_id = await notification_service.send_danger_notification(
                user_id=user.id,
                news_info=news_info
            )
            print(f"🌐 웹 알림 발송 결과: {'성공' if web_notification_id else '실패'} (ID: {web_notification_id})")
            
            # 발송 결과 확인
            success = email_sent or bool(web_notification_id)
            
            # 알림 로그 저장
            await self.log_alert(
                user_id=user.id,
                alert_type='email+web',
                danger_type=news_info.get('danger_info', {}).get('categories', ['unknown'])[0],
                news_info=news_info,
                user_lat=user.current_latitude,
                user_lng=user.current_longitude,
                is_sent=success,
                error_message=None if success else "이메일과 웹 알림 모두 실패"
            )
            
            print(f"✅ 전체 알림 발송 결과: {'성공' if success else '실패'}")
            return success
            
        except Exception as e:
            logger.error(f"위험 알림 발송 실패: {e}")
            print(f"❌ 알림 발송 중 오류 발생: {e}")
            
            # 실패 로그 저장
            await self.log_alert(
                user_id=user.id,
                alert_type='email+web',
                danger_type=news_info.get('danger_info', {}).get('categories', ['unknown'])[0],
                news_info=news_info,
                user_lat=user.current_latitude,
                user_lng=user.current_longitude,
                is_sent=False,
                error_message=str(e)
            )
            
            return False

# 전역 인스턴스
alert_service = AlertService()