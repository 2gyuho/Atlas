from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime
from ..core.database import get_database
from ..models.news import News
from bson import ObjectId

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/", response_model=List[News])
async def get_news(
    country: Optional[str] = Query(None, description="뉴스를 조회할 국가명"),
    limit: int = Query(10, ge=1, le=50, description="조회할 뉴스 개수"),
    skip: int = Query(0, ge=0, description="건너뛸 뉴스 개수")
):
    """
    여행 관련 뉴스를 MongoDB에서 조회합니다.
    """    
    try:
        db = get_database()
        
        # 검색 조건 설정
        query = {}
        if country:
            # 여러 국가명으로 OR 검색 가능하도록 개선
            country_list = country.split(',') if ',' in country else [country]
            location_conditions = []
            
            for c in country_list:
                c = c.strip()
                location_conditions.append({"locations": {"$regex": c, "$options": "i"}})
            
            if len(location_conditions) == 1:
                query = location_conditions[0]
            else:
                query = {"$or": location_conditions}
                
        print(f"MongoDB news query: {query}")
        print(f"Skip: {skip}, Limit: {limit}")
        
        # 뉴스 목록 조회 (published 필드로 최신순 정렬, 없으면 date 필드 사용)
        cursor = db.news.find(query).sort([("published", -1), ("date", -1)]).skip(skip).limit(limit)
        news_list = []
        
        async for news in cursor:
            news["id"] = str(news["_id"])
            del news["_id"]  # _id 필드 제거
            
            # published 필드를 우선적으로 사용, 없으면 date 필드 사용
            if "published" in news and news["published"]:
                # published 필드가 있으면 이를 메인으로 사용
                main_date = news["published"]
                if "date" not in news or not news["date"]:
                    news["date"] = news["published"]  # 호환성을 위해 date 필드에도 설정
            elif "date" in news and news["date"]:
                # published가 없고 date만 있으면 date를 사용
                main_date = news["date"]
                news["published"] = news["date"]  # published 필드에도 설정
            else:
                # 둘 다 없으면 기본값 설정
                main_date = "2024-01-01"
                news["date"] = main_date
                news["published"] = main_date
                
            news_list.append(News(**news))
            
        print(f"Found {len(news_list)} news articles")
        
        return news_list
        
    except Exception as e:
        print(f"Error in get_news: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/count")
async def get_news_count(country: Optional[str] = Query(None)):
    """뉴스 총 개수 조회"""
    try:
        db = get_database()
        
        query = {}
        if country:
            # 여러 국가명으로 OR 검색 가능하도록 개선
            country_list = country.split(',') if ',' in country else [country]
            location_conditions = []
            
            for c in country_list:
                c = c.strip()
                location_conditions.append({"locations": {"$regex": c, "$options": "i"}})
            
            if len(location_conditions) == 1:
                query = location_conditions[0]
            else:
                query = {"$or": location_conditions}
        
        count = await db.news.count_documents(query)
        print(f"Total news count: {count}")
        
        return {"count": count, "country": country}
        
    except Exception as e:
        print(f"Error in get_news_count: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

# 테스트용 엔드포인트
@router.get("/test/sample")
async def test_sample_news():
    """샘플 뉴스 데이터 확인용"""
    try:
        db = get_database()
        # 첫 번째 뉴스 문서 하나만 가져오기
        sample = await db.news.find_one()
        if sample:
            sample["_id"] = str(sample["_id"])
        return {"sample": sample}
    except Exception as e:
        return {"error": str(e)}

@router.get("/test/collections")
async def test_news_collections():
    """뉴스 컬렉션 확인용"""
    try:
        db = get_database()
        collections = await db.list_collection_names()
        news_exists = "news" in collections
        
        if news_exists:
            count = await db.news.count_documents({})
            return {
                "news_collection_exists": True,
                "total_news": count,
                "collections": collections
            }
        else:
            return {
                "news_collection_exists": False,
                "collections": collections
            }
    except Exception as e:
        return {"error": str(e)}
