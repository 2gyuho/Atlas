#!/usr/bin/env python3
"""
관리자 알림 발송 기능 테스트 스크립트
"""

import requests
import json
import asyncio
import sys
import os

# 프로젝트 루트 경로를 Python path에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

API_BASE_URL = "http://localhost:8000"

def test_admin_notification():
    """관리자 알림 발송 기능 테스트"""
    
    print("🚀 관리자 알림 발송 기능 테스트 시작\n")
    
    # 1. 관리자 로그인
    print("1. 관리자 계정으로 로그인...")
    login_data = {
        "username": "admin@test.com",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ 로그인 실패: {login_response.text}")
            return
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ 관리자 로그인 성공")
        
    except Exception as e:
        print(f"❌ 로그인 중 오류: {e}")
        return
    
    # 2. 모든 사용자에게 공지사항 발송 테스트
    print("\n2. 모든 사용자에게 공지사항 발송 테스트...")
    notification_data = {
        "recipient_type": "all",
        "alert_type": "both",
        "danger_type": "admin_notice",
        "title": "시스템 점검 안내",
        "message": "안녕하세요. 시스템 점검으로 인해 내일 오후 2시부터 4시까지 서비스가 일시 중단됩니다. 이용에 불편을 드려 죄송합니다."
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/admin/send-notification",
            json=notification_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 공지사항 발송 성공!")
            print(f"   📊 총 수신자: {result['total_recipients']}명")
            print(f"   ✅ 발송 성공: {result['sent_count']}명")
            print(f"   ❌ 발송 실패: {result['failed_count']}명")
        else:
            print(f"❌ 공지사항 발송 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 공지사항 발송 중 오류: {e}")
    
    # 3. 특정 사용자에게 긴급 알림 발송 테스트
    print("\n3. 특정 사용자에게 긴급 알림 발송 테스트...")
    notification_data = {
        "recipient_type": "specific",
        "user_ids": [1, 2],  # 사용자 ID 1, 2에게 발송
        "alert_type": "email",
        "danger_type": "emergency",
        "title": "긴급 보안 알림",
        "message": "계정에 비정상적인 로그인 시도가 감지되었습니다. 즉시 비밀번호를 변경하시기 바랍니다."
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/admin/send-notification",
            json=notification_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 긴급 알림 발송 성공!")
            print(f"   📊 총 수신자: {result['total_recipients']}명")
            print(f"   ✅ 발송 성공: {result['sent_count']}명")
            print(f"   ❌ 발송 실패: {result['failed_count']}명")
        else:
            print(f"❌ 긴급 알림 발송 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 긴급 알림 발송 중 오류: {e}")
    
    # 4. 위치 기반 경고 발송 테스트 (서울 강남구 주변)
    print("\n4. 위치 기반 경고 발송 테스트...")
    notification_data = {
        "recipient_type": "location_based",
        "location_latitude": 37.5665,
        "location_longitude": 126.9780,
        "radius_km": 10.0,
        "alert_type": "both",
        "danger_type": "warning",
        "title": "강남구 교통 통제 안내",
        "message": "현재 강남구 일대에서 도로 공사로 인한 교통 통제가 진행 중입니다. 우회 도로를 이용해 주시기 바랍니다.",
        "location_name": "서울특별시 강남구"
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/admin/send-notification",
            json=notification_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 위치 기반 경고 발송 성공!")
            print(f"   📊 총 수신자: {result['total_recipients']}명")
            print(f"   ✅ 발송 성공: {result['sent_count']}명")
            print(f"   ❌ 발송 실패: {result['failed_count']}명")
        else:
            print(f"❌ 위치 기반 경고 발송 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 위치 기반 경고 발송 중 오류: {e}")
    
    # 5. 알림 로그 확인
    print("\n5. 발송된 알림 로그 확인...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/api/admin/alert-logs?days=1",
            headers=headers
        )
        
        if response.status_code == 200:
            logs = response.json()
            print(f"✅ 최근 1일 알림 로그 {len(logs)}개 조회 성공")
            
            # 최근 3개 로그 표시
            for i, log in enumerate(logs[:3]):
                print(f"   📋 로그 {i+1}: {log['alert_type']} - {log['danger_type']} - {'성공' if log['is_sent'] else '실패'}")
        else:
            print(f"❌ 알림 로그 조회 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 알림 로그 조회 중 오류: {e}")
    
    print("\n🎉 관리자 알림 발송 기능 테스트 완료!")

if __name__ == "__main__":
    test_admin_notification()
