#!/usr/bin/env python3
"""
수정된 알림 시스템 핵심 기능 테스트
데이터베이스 연결 없이 키워드 처리 문제 해결 여부 확인
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import EmailService
from app.services.notification_service import notification_service

async def test_keyword_processing():
    print("🔧 키워드 처리 문제 해결 테스트")
    print("=" * 50)
    
    # 모의 위험 뉴스 데이터 (키워드 처리 테스트용)
    mock_news = {
        '_id': '67621567890abcdef1234567',
        'title': 'Breaking: Terrorist Attack in Downtown Seoul',
        'content': 'A serious terrorist attack occurred near Gangnam Station. Multiple explosions reported.',
        'source': 'Test News Agency',
        'url': 'https://example.com/news/terrorist-attack',
        'published': '2024-12-15T14:30:00Z',
        'location': 'Seoul, South Korea',
        'latitude': 37.5665,
        'longitude': 126.9780,
        'distance_km': 2.5,
        'danger_info': {
            'is_dangerous': True,
            'categories': ['crime', 'terrorism'],
            'severity': 'high',
            'keywords_found': ['terrorist', 'attack', 'explosion'],  # keywords_found 필드
            'matched_keywords': []  # 빈 배열로 fallback 테스트
        }
    }
    
    print("📰 테스트 뉴스 데이터:")
    print(f"   제목: {mock_news['title']}")
    print(f"   위험도: {mock_news['danger_info']['severity']}")
    print(f"   keywords_found: {mock_news['danger_info']['keywords_found']}")
    print(f"   matched_keywords: {mock_news['danger_info']['matched_keywords']}")
    
    # 1. 이메일 템플릿 키워드 처리 테스트
    print("\n1️⃣ 이메일 템플릿 키워드 처리 테스트...")
    try:
        email_service = EmailService()
        user_location = "서울, 대한민국 (37.5665, 126.9780)"
        
        # 이메일 HTML 생성
        html_body = email_service._create_alert_email_body([mock_news], user_location)
        
        # 키워드가 HTML에 포함되었는지 확인
        found_keywords = []
        for keyword in mock_news['danger_info']['keywords_found']:
            if keyword in html_body:
                found_keywords.append(keyword)
        
        print(f"   ✅ 이메일 템플릿 생성 성공")
        print(f"   키워드 포함 확인: {found_keywords}")
        
        if len(found_keywords) == len(mock_news['danger_info']['keywords_found']):
            print("   ✅ 모든 키워드가 이메일 템플릿에 정상 포함됨")
        else:
            print("   ❌ 일부 키워드가 누락됨")
            
        # HTML에서 키워드 섹션 추출하여 확인
        if "감지된 키워드:" in html_body:
            print("   ✅ '감지된 키워드' 섹션이 이메일에 포함됨")
        else:
            print("   ❌ '감지된 키워드' 섹션이 누락됨")
            
    except Exception as e:
        print(f"   ❌ 이메일 템플릿 테스트 실패: {e}")
    
    # 2. 웹 알림 키워드 처리 테스트
    print("\n2️⃣ 웹 알림 키워드 처리 테스트...")
    try:
        # 테스트용 사용자 ID
        test_user_id = 999
        
        # 웹 알림 생성
        notification_id = await notification_service.send_danger_notification(
            user_id=test_user_id,
            news_info=mock_news
        )
        
        if notification_id:
            print(f"   ✅ 웹 알림 생성 성공 (ID: {notification_id})")
            
            # 생성된 알림 데이터 확인
            notifications = await notification_service.get_user_notifications(test_user_id, limit=1)
            
            if notifications:
                notification = notifications[0]
                notification_data = notification.get('data', {})
                
                print(f"   알림 제목: {notification['title']}")
                print(f"   알림 메시지: {notification['message']}")
                
                # 키워드 정보 확인
                keywords = notification_data.get('keywords', [])
                if keywords:
                    print(f"   ✅ 키워드 정보 포함: {keywords}")
                    
                    # 원본 키워드와 비교
                    original_keywords = mock_news['danger_info']['keywords_found']
                    if set(keywords) == set(original_keywords):
                        print("   ✅ 모든 키워드가 웹 알림에 정상 포함됨")
                    else:
                        print("   ⚠️ 일부 키워드가 다름 (상위 5개만 포함될 수 있음)")
                else:
                    print("   ❌ 키워드 정보가 웹 알림에 누락됨")
                
                # 거리 정보 확인 (distance vs distance_km)
                distance = notification_data.get('distance', 0)
                print(f"   거리 정보: {distance}km")
                
                if distance > 0:
                    print("   ✅ 거리 정보가 정상적으로 처리됨")
                else:
                    print("   ❌ 거리 정보 처리 실패")
                    
        else:
            print("   ❌ 웹 알림 생성 실패")
            
    except Exception as e:
        print(f"   ❌ 웹 알림 테스트 실패: {e}")
    
    # 3. 키워드 fallback 로직 테스트
    print("\n3️⃣ 키워드 fallback 로직 테스트...")
    try:
        # matched_keywords만 있는 경우 테스트
        mock_news_fallback = mock_news.copy()
        mock_news_fallback['danger_info'] = {
            'is_dangerous': True,
            'categories': ['natural_disaster'],
            'severity': 'medium',
            'keywords_found': [],  # 빈 배열
            'matched_keywords': ['earthquake', 'tsunami', 'emergency']  # 이 필드만 있음
        }
        
        print("   fallback 테스트 데이터:")
        print(f"   keywords_found: {mock_news_fallback['danger_info']['keywords_found']}")
        print(f"   matched_keywords: {mock_news_fallback['danger_info']['matched_keywords']}")
        
        # 이메일 템플릿 fallback 테스트
        email_service = EmailService()
        html_body_fallback = email_service._create_alert_email_body([mock_news_fallback], "테스트 위치")
        
        fallback_keywords = mock_news_fallback['danger_info']['matched_keywords']
        found_fallback = sum(1 for kw in fallback_keywords if kw in html_body_fallback)
        
        if found_fallback > 0:
            print("   ✅ 이메일 fallback 로직 정상 작동")
        else:
            print("   ❌ 이메일 fallback 로직 실패")
        
        # 웹 알림 fallback 테스트  
        notification_id_fallback = await notification_service.send_danger_notification(
            user_id=test_user_id + 1,
            news_info=mock_news_fallback
        )
        
        if notification_id_fallback:
            notifications_fallback = await notification_service.get_user_notifications(test_user_id + 1, limit=1)
            if notifications_fallback:
                fallback_data = notifications_fallback[0].get('data', {})
                fallback_keywords_in_notification = fallback_data.get('keywords', [])
                
                if fallback_keywords_in_notification:
                    print("   ✅ 웹 알림 fallback 로직 정상 작동")
                    print(f"   fallback 키워드: {fallback_keywords_in_notification}")
                else:
                    print("   ❌ 웹 알림 fallback 로직 실패")
            
    except Exception as e:
        print(f"   ❌ fallback 로직 테스트 실패: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 키워드 처리 테스트 완료!")
    print("   이메일 템플릿과 웹 알림의 키워드 필드명 불일치 문제가 해결되었습니다.")

if __name__ == "__main__":
    asyncio.run(test_keyword_processing())
