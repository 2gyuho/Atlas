"""
Google Maps API 지오로케이션 기능 테스트 스크립트

이 스크립트를 실행하기 전에:
1. .env 파일에 GEO_API_KEY를 설정해주세요
2. pip install -r requirements.txt로 필요한 패키지를 설치해주세요
3. FastAPI 서버가 실행 중이어야 합니다
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any


class GeolocationTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    async def test_reverse_geocode_post(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """POST 방식으로 역지오코딩 테스트"""
        url = f"{self.base_url}/geolocation/reverse-geocode"
        data = {
            "latitude": latitude,
            "longitude": longitude
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data) as response:
                result = await response.json()
                return {
                    "status_code": response.status,
                    "result": result
                }

    async def test_reverse_geocode_get(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """GET 방식으로 역지오코딩 테스트"""
        url = f"{self.base_url}/geolocation/reverse-geocode"
        params = {
            "latitude": latitude,
            "longitude": longitude
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                result = await response.json()
                return {
                    "status_code": response.status,
                    "result": result
                }

    async def test_geocode_post(self, address: str) -> Dict[str, Any]:
        """POST 방식으로 지오코딩 테스트"""
        url = f"{self.base_url}/geolocation/geocode"
        data = {
            "address": address
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data) as response:
                result = await response.json()
                return {
                    "status_code": response.status,
                    "result": result
                }

    async def test_geocode_get(self, address: str) -> Dict[str, Any]:
        """GET 방식으로 지오코딩 테스트"""
        url = f"{self.base_url}/geolocation/geocode"
        params = {
            "address": address
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                result = await response.json()
                return {
                    "status_code": response.status,
                    "result": result
                }

    def print_result(self, test_name: str, result: Dict[str, Any]):
        """테스트 결과를 예쁘게 출력"""
        print(f"\n{'='*50}")
        print(f"테스트: {test_name}")
        print(f"{'='*50}")
        print(f"상태 코드: {result['status_code']}")
        print(f"응답:")
        print(json.dumps(result['result'], indent=2, ensure_ascii=False))


async def main():
    tester = GeolocationTester()
    
    # 테스트 케이스들
    test_cases = [
        {
            "name": "서울특별시청 역지오코딩 (POST)",
            "type": "reverse_post",
            "latitude": 37.5665,
            "longitude": 126.9780
        },
        {
            "name": "서울특별시청 역지오코딩 (GET)",
            "type": "reverse_get", 
            "latitude": 37.5665,
            "longitude": 126.9780
        },
        {
            "name": "부산역 역지오코딩 (POST)",
            "type": "reverse_post",
            "latitude": 35.1158,
            "longitude": 129.0341
        },
        {
            "name": "서울특별시청 지오코딩 (POST)",
            "type": "geocode_post",
            "address": "서울특별시 중구 세종대로 110"
        },
        {
            "name": "서울특별시청 지오코딩 (GET)",
            "type": "geocode_get",
            "address": "서울특별시 중구 세종대로 110"
        },
        {
            "name": "부산역 지오코딩 (POST)",
            "type": "geocode_post",
            "address": "부산광역시 동구 중앙대로 206"
        }
    ]
    
    print("Google Maps API 지오로케이션 테스트를 시작합니다...")
    print("FastAPI 서버가 http://localhost:8000에서 실행 중인지 확인해주세요.")
    
    for test_case in test_cases:
        try:
            if test_case["type"] == "reverse_post":
                result = await tester.test_reverse_geocode_post(
                    test_case["latitude"], 
                    test_case["longitude"]
                )
            elif test_case["type"] == "reverse_get":
                result = await tester.test_reverse_geocode_get(
                    test_case["latitude"], 
                    test_case["longitude"]
                )
            elif test_case["type"] == "geocode_post":
                result = await tester.test_geocode_post(test_case["address"])
            elif test_case["type"] == "geocode_get":
                result = await tester.test_geocode_get(test_case["address"])
            
            tester.print_result(test_case["name"], result)
            
        except Exception as e:
            print(f"\n❌ {test_case['name']} 테스트 실패: {str(e)}")
    
    print(f"\n{'='*50}")
    print("모든 테스트가 완료되었습니다!")
    print(f"{'='*50}")


if __name__ == "__main__":
    asyncio.run(main())
