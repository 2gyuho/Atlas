#!/usr/bin/env python3
"""
이메일 및 웹 알림 실제 발송 테스트
"""
import asyncio
import sys
import os

# 현재 디렉토리를 Python 패스에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.alert_service import alert_service
from app.services.email_service import email_service
from app.services.notification_service import notification_service
from app.core.database import get_mysql_session
from app.models.mysql_user import MySQLUser
from app.models.alert_log import AlertLog
from sqlalchemy import select, desc
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_alert_sending():
    """실제 알림 발송 테스트"""
    print("🚨 실제 알림 발송 테스트 시작")
    print("=" * 60)
    
    # 1. 테스트 사용자 가져오기
    print("\n1️⃣ 테스트 사용자 정보 확인...")
    async for db in get_mysql_session():
        result = await db.execute(select(MySQLUser).where(MySQLUser.id == 6))
        test_user = result.scalar_one_or_none()
        
        if not test_user:
            print("❌ 테스트 사용자(ID: 6)를 찾을 수 없습니다.")
            return
        
        print(f"✅ 사용자 발견: {test_user.email}")
        print(f"   위치: {test_user.current_latitude}, {test_user.current_longitude}")
        print(f"   알림 설정: enabled={test_user.alert_enabled}")
        break
    
    # 2. 테스트 뉴스 데이터 생성
    test_news = {
        'title': '🚨 URGENT: Emergency System Test - Please Ignore',
        'content': 'This is a comprehensive test of the emergency notification system. This message verifies that both email and web notifications are working correctly. Please ignore this test message.',
        'source': 'Atlas Test System',
        'published': '2024-01-01T12:00:00Z',
        'url': 'https://example.com/test-emergency',
        'danger_info': {
            'severity': 'high',
            'categories': ['public_safety', 'emergency'],
            'matched_keywords': ['emergency', 'urgent', 'test'],
            'keywords_found': ['emergency', 'urgent', 'test']
        },
        'distance_km': 2.1,
        'location': 'Seoul Test Area'
    }
    
    print(f"\n2️⃣ 테스트 뉴스 데이터 생성 완료")
    print(f"   제목: {test_news['title']}")
    print(f"   위험도: {test_news['danger_info']['severity']}")
    
    # 3. 이메일 직접 발송 테스트
    print(f"\n3️⃣ 이메일 직접 발송 테스트...")
    try:
        email_success = await email_service.send_alert_email(
            test_user.email,
            [test_news],
            f"Seoul, Korea ({test_user.current_latitude}, {test_user.current_longitude})"
        )
        
        if email_success:
            print(f"✅ 직접 이메일 발송 성공: {test_user.email}")
        else:
            print(f"❌ 직접 이메일 발송 실패: {test_user.email}")
    except Exception as e:
        print(f"❌ 직접 이메일 발송 오류: {e}")
    
    # 4. 웹 알림 직접 발송 테스트
    print(f"\n4️⃣ 웹 알림 직접 발송 테스트...")
    try:
        web_notification_id = await notification_service.send_danger_notification(
            user_id=test_user.id,
            news_info=test_news
        )
        
        if web_notification_id:
            print(f"✅ 직접 웹 알림 발송 성공: ID={web_notification_id}")
        else:
            print(f"❌ 직접 웹 알림 발송 실패")
    except Exception as e:
        print(f"❌ 직접 웹 알림 발송 오류: {e}")
    
    # 5. AlertService 통합 발송 테스트
    print(f"\n5️⃣ AlertService 통합 발송 테스트...")
    try:
        integrated_success = await alert_service.send_danger_alert(
            user=test_user,
            news_info=test_news
        )
        
        if integrated_success:
            print(f"✅ AlertService 통합 발송 성공")
        else:
            print(f"❌ AlertService 통합 발송 실패")
    except Exception as e:
        print(f"❌ AlertService 통합 발송 오류: {e}")
    
    # 6. 알림 로그 확인
    print(f"\n6️⃣ 최근 알림 로그 확인...")
    async for db in get_mysql_session():
        try:
            result = await db.execute(
                select(AlertLog, MySQLUser)
                .join(MySQLUser, AlertLog.user_id == MySQLUser.id)
                .where(AlertLog.user_id == test_user.id)
                .order_by(desc(AlertLog.created_at))
                .limit(3)
            )
            
            recent_logs = result.all()
            
            if recent_logs:
                print(f"✅ 최근 {len(recent_logs)}개의 알림 로그:")
                for i, (log, user) in enumerate(recent_logs, 1):
                    status = "✅ 성공" if log.is_sent else "❌ 실패"
                    print(f"   {i}. ID:{log.id} | 타입:{log.alert_type} | 상태:{status}")
                    print(f"      뉴스: {log.news_title[:50] if log.news_title else 'N/A'}...")
                    if log.error_message:
                        print(f"      오류: {log.error_message}")
                    print(f"      시간: {log.created_at}")
            else:
                print("❌ 최근 알림 로그가 없습니다.")
        except Exception as e:
            print(f"❌ 알림 로그 조회 오류: {e}")
        break
    
    print(f"\n" + "=" * 60)
    print("🎉 이메일 및 웹 알림 발송 테스트 완료!")
    
    # 7. 요약 정보 표시
    print(f"\n📋 테스트 결과 요약:")
    print(f"   - 테스트 대상: {test_user.email} (ID: {test_user.id})")
    print(f"   - 직접 이메일 발송: {'✅ 성공' if 'email_success' in locals() and email_success else '❌ 실패'}")
    print(f"   - 직접 웹 알림 발송: {'✅ 성공' if 'web_notification_id' in locals() and web_notification_id else '❌ 실패'}")
    print(f"   - AlertService 통합 발송: {'✅ 성공' if 'integrated_success' in locals() and integrated_success else '❌ 실패'}")
    print(f"\n💡 이메일이 발송되었다면 {test_user.email} 계정의 메일함을 확인해주세요.")
    print(f"💡 웹 알림이 발송되었다면 프론트엔드에서 알림을 확인할 수 있습니다.")

if __name__ == "__main__":
    asyncio.run(test_alert_sending())
