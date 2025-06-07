from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any
from app.services.geolocation import geolocation_service

router = APIRouter(prefix="/geolocation", tags=["geolocation"])


class CoordinatesRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="위도 (-90 ~ 90)")
    longitude: float = Field(..., ge=-180, le=180, description="경도 (-180 ~ 180)")


class AddressRequest(BaseModel):
    address: str = Field(..., min_length=1, description="주소")


@router.post("/reverse-geocode", summary="좌표를 주소로 변환")
async def reverse_geocode(coordinates: CoordinatesRequest) -> Dict[str, Any]:
    """
    위도, 경도를 받아서 주소로 변환합니다.
    
    - **latitude**: 위도 (-90 ~ 90)
    - **longitude**: 경도 (-180 ~ 180)
    
    반환값:
    - **formatted_address**: 전체 주소
    - **location_info**: 상세 주소 정보 (국가, 시/도, 시/군/구, 동/면/읍 등)
    - **coordinates**: 입력된 좌표
    """
    return geolocation_service.reverse_geocode(
        coordinates.latitude, 
        coordinates.longitude
    )


@router.get("/reverse-geocode", summary="좌표를 주소로 변환 (GET 방식)")
async def reverse_geocode_get(
    latitude: float = Query(..., ge=-90, le=90, description="위도"),
    longitude: float = Query(..., ge=-180, le=180, description="경도")
) -> Dict[str, Any]:
    """
    GET 방식으로 위도, 경도를 받아서 주소로 변환합니다.
    
    - **latitude**: 위도 (-90 ~ 90)
    - **longitude**: 경도 (-180 ~ 180)
    """
    return geolocation_service.reverse_geocode(latitude, longitude)


@router.post("/geocode", summary="주소를 좌표로 변환")
async def geocode(address_request: AddressRequest) -> Dict[str, Any]:
    """
    주소를 받아서 위도, 경도로 변환합니다.
    
    - **address**: 변환할 주소
    
    반환값:
    - **formatted_address**: 정규화된 주소
    - **coordinates**: 좌표 정보 (위도, 경도)
    """
    return geolocation_service.geocode(address_request.address)


@router.get("/geocode", summary="주소를 좌표로 변환 (GET 방식)")
async def geocode_get(
    address: str = Query(..., min_length=1, description="주소")
) -> Dict[str, Any]:
    """
    GET 방식으로 주소를 받아서 위도, 경도로 변환합니다.
    
    - **address**: 변환할 주소
    """
    return geolocation_service.geocode(address)


@router.get("/reverse", summary="좌표를 주소로 변환 (간단한 엔드포인트)")
async def reverse_geocode_simple(
    lat: float = Query(..., ge=-90, le=90, description="위도"),
    lng: float = Query(..., ge=-180, le=180, description="경도")
) -> Dict[str, Any]:
    """
    간단한 형태로 위도, 경도를 받아서 주소로 변환합니다.
    프론트엔드 호환성을 위한 엔드포인트입니다.
    
    - **lat**: 위도 (-90 ~ 90)
    - **lng**: 경도 (-180 ~ 180)
    """
    return geolocation_service.reverse_geocode(lat, lng)
