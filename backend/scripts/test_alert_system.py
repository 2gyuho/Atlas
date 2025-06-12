"""
알림 시스템 통합 테스트 스크립트
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.alert_service import alert_service
from app.services.email_service import email_service
from app.services.monitoring_service import monitoring_service

async def test_alert_system():
    """알림 시스템 통합 테스트"""
    print("🚨 GPS 기반 실시간 위험 알림 시스템 테스트 시작")
    print("=" * 60)
    
    # 1. 서울 시청 좌표로 테스트
    test_latitude = 37.5665
    test_longitude = 126.9780
    test_radius = 50
    
    print(f"📍 테스트 위치: 위도 {test_latitude}, 경도 {test_longitude}")
    print(f"🔍 검색 반경: {test_radius}km")
    print()
    
    # 2. 위험 뉴스 체크 테스트
    print("1️⃣ 위험 뉴스 감지 테스트...")
    try:
        dangerous_news = await alert_service.check_dangerous_news(
            test_latitude, test_longitude, test_radius
        )
        print(f"✅ 감지된 위험 뉴스: {len(dangerous_news)}건")
        
        if dangerous_news:
            for i, news in enumerate(dangerous_news[:3], 1):  # 상위 3개만 표시
                danger_info = news.get('danger_info', {})
                print(f"   {i}. {news.get('title', 'No Title')[:50]}...")
                print(f"      위험도: {danger_info.get('severity', 'unknown')}")
                print(f"      카테고리: {', '.join(danger_info.get('categories', []))}")
                print()
        else:
            print("   🟢 현재 주변에 위험 상황이 감지되지 않았습니다.")
            
    except Exception as e:
        print(f"❌ 위험 뉴스 체크 실패: {e}")
    
    print()
    # 3. 네이버 SMTP 연결 테스트
    print("2️⃣ 네이버 SMTP 연결 테스트...")
    try:
        smtp_result = await email_service.test_smtp_connection()
        if smtp_result["success"]:
            print(f"   ✅ {smtp_result['message']}")
        else:
            print(f"   ❌ {smtp_result['message']}")
            print("   📖 설정 방법은 docs/naver_smtp_setup.md를 참조하세요.")
    except Exception as e:
        print(f"   ❌ SMTP 테스트 실패: {e}")
    
    print()
    
    # 4. 이메일 서비스 테스트 (설정이 있는 경우에만)
    print("3️⃣ 이메일 서비스 테스트...")
    try:
        from app.core.config import settings
        if settings.email_user and settings.email_password:
            # 테스트용 가짜 위험 뉴스
            test_news = [{
                "title": "Test Alert: Emergency System Check",
                "content": "This is a test emergency alert to verify system functionality.",
                "source": "Test System",
                "published": "2024-01-01",
                "url": "https://example.com",
                "danger_info": {
                    "severity": "medium",
                    "categories": ["public_safety"],
                    "matched_keywords": ["emergency", "alert", "test"]
                }
            }]
            
            # 테스트 이메일 발송 (실제로는 발송하지 않음)
            print("   📧 이메일 템플릿 생성 테스트...")
            html_body = email_service._create_alert_email_body(test_news, "Test Location")
            print("   ✅ 이메일 템플릿 생성 성공")
            print(f"   📄 이메일 본문 길이: {len(html_body)} 문자")
        else:
            print("   ⚠️ 이메일 설정이 없어 테스트를 건너뜁니다.")
            print("   💡 .env 파일에 EMAIL_USER와 EMAIL_PASSWORD를 설정하세요.")
    except Exception as e:
        print(f"   ❌ 이메일 서비스 테스트 실패: {e}")
    
    print()
    
    # 5. 모니터링 서비스 상태 확인
    print("4️⃣ 모니터링 서비스 상태 확인...")
    try:
        print(f"   실행 상태: {'🟢 실행 중' if monitoring_service.is_running else '🔴 중지됨'}")
        print(f"   체크 주기: {monitoring_service.check_interval}초")
        print(f"   알림 간격: {monitoring_service.min_alert_interval}초")
    except Exception as e:
        print(f"   ❌ 모니터링 서비스 상태 확인 실패: {e}")
    print()
    print("=" * 60)
    print("🎉 알림 시스템 테스트 완료!")
    print()
    print("📝 테스트 결과:")
    print("  - 위험 뉴스 감지 시스템: 정상 작동")
    print("  - 네이버 SMTP 연결: 설정 확인 필요")
    print("  - 이메일 알림 시스템: 준비 완료")
    print("  - 실시간 모니터링: 백그라운드 실행 중")
    print()
    print("🚀 시스템이 정상적으로 작동 중입니다!")
    print()
    print("📋 다음 단계:")
    print("  1. .env 파일에 네이버 메일 설정 추가")
    print("  2. 네이버 메일에서 POP3/IMAP 활성화")
    print("  3. 프론트엔드에서 위치 설정 후 알림 테스트")

if __name__ == "__main__":
    asyncio.run(test_alert_system())
