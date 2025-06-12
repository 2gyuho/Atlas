from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
import pytz
from ..core.database import get_mongodb

router = APIRouter(prefix="/api/weather", tags=["weather"])

@router.get("/")
async def get_weather_info(
    country: str = Query(..., description="Country name or code"),
    city: Optional[str] = Query(None, description="City name (optional)")
):
    """
    MongoDB weather 컬렉션에서 선택된 국가의 날씨 정보를 가져옵니다.
    """
    try:
        db = get_mongodb()
        weather_collection = db.weather
        
        # 국가명과 도시명으로 검색 조건 구성
        search_filter = {}
        
        # 국가명으로 검색 (대소문자 구분 없이)
        country_pattern = {"$regex": country, "$options": "i"}
        search_filter["$or"] = [
            {"country": country_pattern},
            {"country_code": country_pattern}
        ]
        
        # 도시명이 제공된 경우 추가 필터링
        if city:
            city_pattern = {"$regex": city, "$options": "i"}
            search_filter["$or"].extend([
                {"city": city_pattern},
                {"location": city_pattern}
            ])
        
        # 날씨 데이터 검색
        weather_data = await weather_collection.find(
            search_filter
        ).limit(1).to_list(1)
        
        if not weather_data:
            # 기본 날씨 정보 반환 (실제 데이터가 없는 경우)
            return {
                "country": country,
                "city": city or "수도",
                "temperature": "20°C",
                "condition": "맑음",
                "humidity": "60%",
                "wind_speed": "5 km/h",
                "description": f"{country}의 현재 날씨 정보입니다.",
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "timezone": None,
                "local_time": None
            }
        
        weather = weather_data[0]
        
        # 시간대 정보 처리
        timezone_info = weather.get('timezone')
        local_time = None
        
        if timezone_info:
            try:
                tz = pytz.timezone(timezone_info)
                local_time = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
            except:
                # 기본 UTC 시간 사용
                local_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        
        return {
            "country": weather.get("country", country),
            "city": weather.get("city", city or "수도"),
            "temperature": weather.get("temperature", "N/A"),
            "condition": weather.get("condition", "정보 없음"),
            "humidity": weather.get("humidity", "N/A"),
            "wind_speed": weather.get("wind_speed", "N/A"),
            "description": weather.get("description", f"{country}의 날씨 정보"),
            "last_updated": weather.get("last_updated", datetime.now(timezone.utc).isoformat()),
            "timezone": timezone_info,
            "local_time": local_time,
            "icon": weather.get("icon", "01d"),  # 기본 아이콘
            "feels_like": weather.get("feels_like"),
            "pressure": weather.get("pressure"),
            "visibility": weather.get("visibility")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"날씨 정보를 가져오는 중 오류가 발생했습니다: {str(e)}")

@router.get("/timezone")
async def get_timezone_info(
    country: str = Query(..., description="Country name or code"),
    city: Optional[str] = Query(None, description="City name (optional)")
):
    """
    선택된 국가/도시의 현재 시간 정보를 가져옵니다.
    """
    try:
        db = get_mongodb()
        weather_collection = db.weather
        
        # 시간대 정보 검색
        search_filter = {
            "$or": [
                {"country": {"$regex": country, "$options": "i"}},
                {"country_code": {"$regex": country, "$options": "i"}}
            ]
        }
        
        if city:
            search_filter["$or"].extend([
                {"city": {"$regex": city, "$options": "i"}},
                {"location": {"$regex": city, "$options": "i"}}
            ])
        
        timezone_data = await weather_collection.find(
            search_filter,
            {"timezone": 1, "country": 1, "city": 1}
        ).limit(1).to_list(1)
        
        if not timezone_data:
            # 기본 시간대 매핑
            default_timezones = {
                "일본": "Asia/Tokyo",
                "미국": "America/New_York",
                "영국": "Europe/London",
                "프랑스": "Europe/Paris",
                "독일": "Europe/Berlin",
                "이탈리아": "Europe/Rome",
                "스페인": "Europe/Madrid",
                "캐나다": "America/Toronto",
                "호주": "Australia/Sydney",
                "태국": "Asia/Bangkok",
                "베트남": "Asia/Ho_Chi_Minh",
                "싱가포르": "Asia/Singapore",
                "중국": "Asia/Shanghai",
                "인도": "Asia/Kolkata",
                "브라질": "America/Sao_Paulo",
                "멕시코": "America/Mexico_City",
                "러시아": "Europe/Moscow",
                "한국": "Asia/Seoul"
            }
            
            timezone_str = default_timezones.get(country, "UTC")
        else:
            timezone_str = timezone_data[0].get("timezone", "UTC")
        
        try:
            tz = pytz.timezone(timezone_str)
            current_time = datetime.now(tz)
            
            return {
                "country": country,
                "city": city,
                "timezone": timezone_str,
                "current_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "utc_offset": current_time.strftime("%z"),
                "is_dst": current_time.dst() != current_time.replace(tzinfo=None).dst() if hasattr(current_time, 'dst') else False,
                "formatted_time": current_time.strftime("%Y년 %m월 %d일 %H시 %M분")
            }
        except Exception as tz_error:
            # UTC 시간으로 폴백
            utc_time = datetime.now(timezone.utc)
            return {
                "country": country,
                "city": city,
                "timezone": "UTC",
                "current_time": utc_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
                "utc_offset": "+0000",
                "is_dst": False,
                "formatted_time": utc_time.strftime("%Y년 %m월 %d일 %H시 %M분 (UTC)")
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"시간 정보를 가져오는 중 오류가 발생했습니다: {str(e)}")

@router.get("/simple")
async def get_simple_weather(
    country: str = Query(..., description="국가명(한글 또는 영문) 또는 국가코드")
):
    """
    city 필드에서 괄호 안 국가명 또는 전체 문자열에 country가 포함된 날씨 데이터 반환
    """
    try:
        db = get_mongodb()
        weather_collection = db.weather

        # city 필드에서 괄호 안 국가명 또는 전체 문자열에 country가 포함되어 있는지 검색
        search_filter = {
            "$or": [
                {"﻿city": {"$regex": f"\\({country}\\)", "$options": "i"}},
                {"﻿city": {"$regex": country, "$options": "i"}}
            ]
        }
        weather_data = await weather_collection.find(search_filter).sort("date", -1).limit(1).to_list(1)
        if not weather_data:
            return {
                "city": None,
                "date": None,
                "min_temp": None,
                "max_temp": None,
                "weather": None,
                "rp": None,
                "rainfall": None
            }
        w = weather_data[0]
        return {
            "city": w.get("﻿city"),
            "date": w.get("date"),
            "min_temp": w.get("min_temp"),
            "max_temp": w.get("max_temp"),
            "weather": w.get("weather"),
            "rp": w.get("rp"),
            "rainfall": w.get("rainfall")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"날씨 정보를 가져오는 중 오류: {str(e)}")

@router.get("/smart")
async def get_smart_weather(
    country: str = Query(..., description="국가명(한글 또는 영문) 또는 국가코드"),
    alt: Optional[str] = Query(None, description="대체 국가명(영문 또는 한글)")
):
    """
    city 필드에서 괄호 안 또는 전체 문자열에 country 또는 alt가 포함된 날씨 데이터 반환
    """
    try:
        db = get_mongodb()
        weather_collection = db.weather
        or_conditions = [
            {"﻿city": {"$regex": f"\\({country}\\)", "$options": "i"}},
            {"﻿city": {"$regex": country, "$options": "i"}}
        ]
        if alt:
            or_conditions.extend([
                {"﻿city": {"$regex": f"\\({alt}\\)", "$options": "i"}},
                {"﻿city": {"$regex": alt, "$options": "i"}}
            ])
        search_filter = {"$or": or_conditions}
        weather_data = await weather_collection.find(search_filter).sort("date", -1).limit(1).to_list(1)
        if not weather_data:
            return {
                "city": None,
                "date": None,
                "min_temp": None,
                "max_temp": None,
                "weather": None,
                "rp": None,
                "rainfall": None
            }
        w = weather_data[0]
        return {
            "city": w.get("﻿city"),
            "date": w.get("date"),
            "min_temp": w.get("min_temp"),
            "max_temp": w.get("max_temp"),
            "weather": w.get("weather"),
            "rp": w.get("rp"),
            "rainfall": w.get("rainfall")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"날씨 정보를 가져오는 중 오류: {str(e)}")

@router.get("/smart2")
async def get_smart2_weather(
    country: str = Query(..., description="국가명(한글 또는 영문) 또는 국가코드"),
    alt: Optional[str] = Query(None, description="대체 국가명(영문 또는 한글)")
):
    """
    city 필드에서 괄호 안 국가명(예: Tokyo (Japan)) 또는 전체 문자열에 country/alt가 포함된 날씨 데이터 반환
    """
    try:
        db = get_mongodb()
        weather_collection = db.weather
        or_conditions = []
        # 괄호 안에 country/alt가 들어가는 경우
        or_conditions.append({"﻿city": {"$regex": f"\\({country}\\)", "$options": "i"}})
        or_conditions.append({"﻿city": {"$regex": country, "$options": "i"}})
        if alt:
            or_conditions.append({"﻿city": {"$regex": f"\\({alt}\\)", "$options": "i"}})
            or_conditions.append({"﻿city": {"$regex": alt, "$options": "i"}})
        search_filter = {"$or": or_conditions}
        weather_data = await weather_collection.find(search_filter).sort("date", -1).limit(1).to_list(1)
        if not weather_data:
            return {
                "city": None,
                "date": None,
                "min_temp": None,
                "max_temp": None,
                "weather": None,
                "rp": None,
                "rainfall": None
            }
        w = weather_data[0]
        return {
            "city": w.get("﻿city"),
            "date": w.get("date"),
            "min_temp": w.get("min_temp"),
            "max_temp": w.get("max_temp"),
            "weather": w.get("weather"),
            "rp": w.get("rp"),
            "rainfall": w.get("rainfall")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"날씨 정보를 가져오는 중 오류: {str(e)}")

@router.get("/smart3")
async def get_smart3_weather(
    country: str = Query(..., description="국가명(한글 또는 영문) 또는 국가코드"),
    alt: Optional[str] = Query(None, description="대체 국가명(영문 또는 한글)")
):
    """
    city/BOM city 필드에서 괄호 안 또는 전체 문자열에 country/alt가 포함된 날씨 데이터 반환 (BOM/비BOM 모두 대응)
    """
    try:
        db = get_mongodb()
        weather_collection = db.weather
        or_conditions = []
        for field in ["﻿city", "city"]:
            or_conditions.append({field: {"$regex": f"\\({country}\\)", "$options": "i"}})
            or_conditions.append({field: {"$regex": country, "$options": "i"}})
            if alt:
                or_conditions.append({field: {"$regex": f"\\({alt}\\)", "$options": "i"}})
                or_conditions.append({field: {"$regex": alt, "$options": "i"}})
        search_filter = {"$or": or_conditions}
        weather_data = await weather_collection.find(search_filter).sort("date", -1).limit(1).to_list(1)
        if not weather_data:
            return {
                "city": None,
                "date": None,
                "min_temp": None,
                "max_temp": None,
                "weather": None,
                "rp": None,
                "rainfall": None
            }
        w = weather_data[0]
        city_val = w.get("﻿city") or w.get("city")
        return {
            "city": city_val,
            "date": w.get("date"),
            "min_temp": w.get("min_temp"),
            "max_temp": w.get("max_temp"),
            "weather": w.get("weather"),
            "rp": w.get("rp"),
            "rainfall": w.get("rainfall")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"날씨 정보를 가져오는 중 오류: {str(e)}")
