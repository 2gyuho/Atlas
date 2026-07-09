#!/usr/bin/env python3
"""
수정된 알림 시스템 테스트
이메일 템플릿과 웹 알림의 키워드 처리 문제가 해결되었는지 확인
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.services.alert_service import alert_service
from app.services.email_service import EmailService
from app.services.notification_service import notification_service
from app.models.mysql_user import MySQLUser
from app.models.alert_log import AlertLog
from app.core.database import get_mysql_session

async def test_fixed_notifications():
    print("🔧 수정된 알림 시스템 테스트 시작")
    print("=" * 60)
      # 1. 테스트 사용자 조회
    print("1️⃣ 테스트 사용자 조회...")
    try:
        from sqlalchemy import select
        async for db in get_mysql_session():
            result = await db.execute(select(MySQLUser).filter(MySQLUser.id == 6))
            test_user = result.scalar_one_or_none()
            if not test_user:
                print("❌ 테스트 사용자(ID: 6)를 찾을 수 없습니다.")
                return
            
            print(f"✅ 테스트 사용자: {test_user.email}")
            print(f"   위치: ({test_user.current_latitude}, {test_user.current_longitude})")
            print(f"   알림 설정: {'활성화' if test_user.alert_enabled else '비활성화'}")
            break
    except Exception as e:
        print(f"❌ 사용자 조회 실패: {e}")
        return
    
    # 2. 모의 위험 뉴스 데이터 생성 (키워드 처리 테스트용)
    print("\n2️⃣ 모의 위험 뉴스 데이터 생성...")
    
    mock_news = {
        '_id': '67621567890abcdef1234567',
        'title': 'Breaking: Terrorist Attack in Seoul Downtown Area',
        'content': 'A serious terrorist attack occurred near Gangnam Station. Multiple explosions reported. Police advise avoiding the area.',
        'source': 'Test News Agency',
        'url': 'https://example.com/news/terrorist-attack-seoul',
        'published': '2024-12-15T14:30:00Z',
        'location': 'Seoul, South Korea',
        'latitude': 37.5665,
        'longitude': 126.9780,
        'distance_km': 2.5,
        'danger_info': {
            'is_dangerous': True,
            'categories': ['crime', 'terrorism'],
            'severity': 'high',
            'keywords_found': ['terrorist', 'attack', 'explosion', 'police'],  # keywords_found 사용
            'matched_keywords': []  # 빈 배열로 설정하여 fallback 테스트
        }
    }
    
    print(f"✅ 모의 뉴스 생성 완료")
    print(f"   제목: {mock_news['title']}")
    print(f"   위험도: {mock_news['danger_info']['severity']}")
    print(f"   키워드: {mock_news['danger_info']['keywords_found']}")
    
    # 3. 이메일 템플릿 테스트
    print("\n3️⃣ 이메일 템플릿 키워드 처리 테스트...")
    try:
        email_service = EmailService()
        user_location = f"서울, 대한민국 ({test_user.current_latitude:.4f}, {test_user.current_longitude:.4f})"
        
        # 이메일 HTML 생성만 테스트 (실제 발송은 하지 않음)
        html_body = email_service._create_alert_email_body([mock_news], user_location)
        
        # 키워드가 제대로 포함되었는지 확인
        keywords_in_html = any(keyword in html_body for keyword in mock_news['danger_info']['keywords_found'])
        
        print(f"✅ 이메일 템플릿 생성 성공")
        print(f"   키워드 포함 여부: {'성공' if keywords_in_html else '실패'}")
        
        # HTML 일부 미리보기
        if "terrorist" in html_body and "attack" in html_body:
            print("   ✅ 키워드가 이메일 템플릿에 정상적으로 포함됨")
        else:
            print("   ❌ 키워드가 이메일 템플릿에 누락됨")
            
    except Exception as e:
        print(f"❌ 이메일 템플릿 테스트 실패: {e}")
    
    # 4. 웹 알림 데이터 구조 테스트
    print("\n4️⃣ 웹 알림 데이터 구조 테스트...")
    try:
        notification_id = await notification_service.send_danger_notification(
            user_id=test_user.id,
            news_info=mock_news
        )
        
        if notification_id:
            print(f"✅ 웹 알림 생성 성공 (ID: {notification_id})")
            
            # 생성된 알림 확인
            notifications = await notification_service.get_user_notifications(test_user.id, limit=1)
            if notifications:
                latest_notification = notifications[0]
                print(f"   제목: {latest_notification['title']}")
                print(f"   메시지: {latest_notification['message']}")
                
                # 키워드 정보 확인
                notification_data = latest_notification.get('data', {})
                keywords = notification_data.get('keywords', [])
                
                if keywords:
                    print(f"   ✅ 키워드 정보 포함: {keywords}")
                else:
                    print(f"   ❌ 키워드 정보 누락")
                    
                # distance vs distance_km 필드 확인
                distance = notification_data.get('distance', 0)
                print(f"   거리 정보: {distance}km")
                
        else:
            print("❌ 웹 알림 생성 실패")
            
    except Exception as e:
        print(f"❌ 웹 알림 테스트 실패: {e}")
    
    # 5. 통합 알림 발송 테스트
    print("\n5️⃣ 통합 알림 발송 테스트...")
    try:
        success = await alert_service.send_danger_alert(test_user, mock_news)
        
        if success:
            print("✅ 통합 알림 발송 성공!")
            print("   이메일과 웹 알림이 모두 정상적으로 처리되었습니다.")
        else:
            print("❌ 통합 알림 발송 실패")
            print("   일부 또는 모든 알림이 실패했습니다.")
            
    except Exception as e:
        print(f"❌ 통합 알림 발송 테스트 실패: {e}")
    
    # 6. 알림 로그 확인
    print("\n6️⃣ 최근 알림 로그 확인...")
    try:
        from app.models.alert_log import AlertLog
        
        async for db in get_mysql_session():
            recent_logs = db.query(AlertLog).filter(
                AlertLog.user_id == test_user.id
            ).order_by(AlertLog.created_at.desc()).limit(3).all()
            
            if recent_logs:
                print(f"✅ 최근 알림 로그 {len(recent_logs)}건 발견:")
                for log in recent_logs:
                    status = "성공" if log.is_sent else "실패"
                    print(f"   - {log.created_at}: {log.alert_type} 알림 {status}")
                    if log.error_message:
                        print(f"     오류: {log.error_message}")
            else:
                print("❌ 최근 알림 로그가 없습니다.")
            break
            
    except Exception as e:
        print(f"❌ 알림 로그 확인 실패: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 테스트 완료!")
    print("   이메일 템플릿과 웹 알림의 키워드 처리 문제가 해결되었는지 확인하세요.")

if __name__ == "__main__":
    asyncio.run(test_fixed_notifications())
