#!/usr/bin/env python3
"""
이메일 및 웹 알림 전송 테스트 스크립트
"""
import asyncio
import sys
import os

# 현재 디렉토리를 Python 패스에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.alert_service import alert_service
from app.services.email_service import email_service
from app.services.notification_service import notification_service
from app.services.monitoring_service import monitoring_service
from app.core.database import get_mysql_session
from app.models.mysql_user import MySQLUser
from sqlalchemy import select

async def test_email_and_web_notifications():
    """이메일 및 웹 알림 전송 테스트"""
    print("🚨 이메일 및 웹 알림 전송 테스트 시작")
    print("=" * 60)
    
    # 1. 테스트 사용자 확인
    print("\n1️⃣ 테스트 사용자 확인...")
    async for db in get_mysql_session():
        result = await db.execute(select(MySQLUser).where(MySQLUser.id == 6))
        test_user = result.scalar_one_or_none()
        if test_user:
            print(f"✅ 사용자 발견: {test_user.email}")
            print(f"   위치: {test_user.current_latitude}, {test_user.current_longitude}")
            print(f"   알림 설정: enabled={test_user.alert_enabled}, radius={test_user.alert_radius_km}km")
        else:
            print("❌ 테스트 사용자를 찾을 수 없습니다.")
            return
        break
    
    # 2. SMTP 연결 테스트
    print("\n2️⃣ SMTP 연결 테스트...")
    smtp_result = await email_service.test_smtp_connection()
    if smtp_result["success"]:
        print(f"✅ {smtp_result['message']}")
    else:
        print(f"❌ {smtp_result['message']}")
        return
    
    # 3. 테스트 이메일 발송
    print("\n3️⃣ 테스트 이메일 발송...")
    test_news_data = [{
        'title': '🚨 Emergency Alert: System Test',
        'content': 'This is a comprehensive test of the emergency notification system. The system is verifying email delivery capabilities.',
        'source': 'Atlas Emergency System',
        'published': '2024-01-01T12:00:00Z',
        'url': 'https://example.com/emergency-test',
        'danger_info': {
            'severity': 'high',
            'categories': ['public_safety', 'emergency'],
            'matched_keywords': ['emergency', 'alert', 'danger', 'test'],
            'keywords_found': ['emergency', 'alert', 'danger', 'test']
        },
        'distance_km': 3.5,
        'location': 'Seoul Test Area'
    }]
    
    email_success = await email_service.send_alert_email(
        test_user.email,
        test_news_data,
        f"Seoul, Korea ({test_user.current_latitude}, {test_user.current_longitude})"
    )
    
    if email_success:
        print(f"✅ 이메일 발송 성공: {test_user.email}")
    else:
        print(f"❌ 이메일 발송 실패: {test_user.email}")
    
    # 4. 웹 알림 발송 테스트
    print("\n4️⃣ 웹 알림 발송 테스트...")
    try:
        web_notification_id = await notification_service.send_danger_notification(
            user_id=test_user.id,
            news_info=test_news_data[0]
        )
        
        if web_notification_id:
            print(f"✅ 웹 알림 생성 성공: ID={web_notification_id}")
        else:
            print("❌ 웹 알림 생성 실패")
    except Exception as e:
        print(f"❌ 웹 알림 생성 오류: {e}")
    
    # 5. 통합 알림 발송 테스트 (AlertService의 send_danger_alert)
    print("\n5️⃣ 통합 알림 발송 테스트...")
    try:
        integrated_success = await alert_service.send_danger_alert(
            user=test_user,
            news_info=test_news_data[0]
        )
        
        if integrated_success:
            print("✅ 통합 알림 발송 성공 (이메일 + 웹 알림)")
        else:
            print("❌ 통합 알림 발송 실패")
    except Exception as e:
        print(f"❌ 통합 알림 발송 오류: {e}")
    
    # 6. 모니터링 서비스를 통한 실시간 체크
    print("\n6️⃣ 모니터링 서비스 실시간 체크...")
    try:
        monitoring_result = await monitoring_service.check_user_now(test_user.id)
        print(f"모니터링 결과: {monitoring_result}")
    except Exception as e:
        print(f"❌ 모니터링 서비스 오류: {e}")
    
    # 7. 실제 위험 뉴스 체크
    print("\n7️⃣ 실제 위험 뉴스 체크...")
    try:
        dangerous_news = await alert_service.check_dangerous_news_near_location(
            latitude=test_user.current_latitude,
            longitude=test_user.current_longitude,
            radius_km=test_user.alert_radius_km or 50
        )
        
        print(f"✅ 위험 뉴스 {len(dangerous_news)}건 발견")
        
        if dangerous_news:
            print("   상위 3개 위험 뉴스:")
            for i, news in enumerate(dangerous_news[:3], 1):
                danger_info = news.get('danger_info', {})
                print(f"   {i}. {news.get('title', 'No Title')[:60]}...")
                print(f"      위험도: {danger_info.get('severity', 'unknown')}")
                print(f"      거리: {news.get('distance_km', 'unknown')}km")
    except Exception as e:
        print(f"❌ 위험 뉴스 체크 오류: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 이메일 및 웹 알림 테스트 완료!")
    print("\n📋 테스트 요약:")
    print(f"   - SMTP 연결: {'✅ 성공' if smtp_result['success'] else '❌ 실패'}")
    print(f"   - 이메일 발송: {'✅ 성공' if email_success else '❌ 실패'}")
    print(f"   - 웹 알림: 테스트 완료")
    print(f"   - 통합 알림: 테스트 완료")
    print(f"   - 위험 뉴스 감지: 테스트 완료")

if __name__ == "__main__":
    asyncio.run(test_email_and_web_notifications())
