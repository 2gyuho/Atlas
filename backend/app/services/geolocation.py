import googlemaps
import os
from typing import Optional, Dict, Any
from fastapi import HTTPException
from ..core.config import settings


class GeolocationService:
    def __init__(self):
        self.api_key = settings.geo_api_key
        if not self.api_key or self.api_key == "your_google_maps_api_key_here":
            raise ValueError("GEO_API_KEY가 환경변수에 설정되지 않았습니다.")
        self.gmaps = googlemaps.Client(key=self.api_key)

    def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        위도, 경도를 받아서 주소로 변환하는 함수
        
        Args:
            latitude (float): 위도
            longitude (float): 경도
            
        Returns:
            Dict[str, Any]: 주소 정보
        """
        try:
            # Google Maps Geocoding API를 사용해서 역지오코딩 수행
            result = self.gmaps.reverse_geocode((latitude, longitude), language='ko')
            
            if not result:
                raise HTTPException(
                    status_code=404, 
                    detail="해당 위치에 대한 주소를 찾을 수 없습니다."
                )
            
            # 결과에서 필요한 정보 추출
            location_info = self._parse_address_components(result[0])
            
            return {
                "success": True,
                "formatted_address": result[0].get("formatted_address"),
                "location_info": location_info,
                "coordinates": {
                    "latitude": latitude,
                    "longitude": longitude
                }
            }
            
        except googlemaps.exceptions.ApiError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Google Maps API 오류: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"지오코딩 처리 중 오류가 발생했습니다: {str(e)}"
            )

    def _parse_address_components(self, result: Dict[str, Any]) -> Dict[str, str]:
        """
        Google Maps API 응답에서 주소 구성요소를 파싱하는 함수
        
        Args:
            result (Dict[str, Any]): Google Maps API 응답
            
        Returns:
            Dict[str, str]: 파싱된 주소 정보
        """
        components = result.get("address_components", [])
        location_info = {
            "country": "",
            "administrative_area_level_1": "",  # 도/시
            "administrative_area_level_2": "",  # 시/군/구
            "locality": "",                     # 동/면/읍
            "route": "",                        # 도로명
            "street_number": "",                # 번지
            "postal_code": ""                   # 우편번호
        }
        
        for component in components:
            types = component.get("types", [])
            long_name = component.get("long_name", "")
            
            if "country" in types:
                location_info["country"] = long_name
            elif "administrative_area_level_1" in types:
                location_info["administrative_area_level_1"] = long_name
            elif "administrative_area_level_2" in types:
                location_info["administrative_area_level_2"] = long_name
            elif "locality" in types or "sublocality_level_1" in types:
                location_info["locality"] = long_name
            elif "route" in types:
                location_info["route"] = long_name
            elif "street_number" in types:
                location_info["street_number"] = long_name
            elif "postal_code" in types:
                location_info["postal_code"] = long_name
        
        return location_info

    def geocode(self, address: str) -> Dict[str, Any]:
        """
        주소를 받아서 위도, 경도로 변환하는 함수 (추가 기능)
        
        Args:
            address (str): 주소
            
        Returns:
            Dict[str, Any]: 좌표 정보
        """
        try:
            result = self.gmaps.geocode(address, language='ko')
            
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail="해당 주소에 대한 좌표를 찾을 수 없습니다."
                )
            
            location = result[0]["geometry"]["location"]
            
            return {
                "success": True,
                "address": address,
                "formatted_address": result[0].get("formatted_address"),
                "coordinates": {
                    "latitude": location["lat"],
                    "longitude": location["lng"]
                }
            }
            
        except googlemaps.exceptions.ApiError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Google Maps API 오류: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"지오코딩 처리 중 오류가 발생했습니다: {str(e)}"
            )


# 싱글톤 인스턴스
geolocation_service = GeolocationService()
