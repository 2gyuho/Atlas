from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from ..core.database import get_database
from ..models.embassy import Embassy
from bson import ObjectId

router = APIRouter(prefix="/embassies", tags=["embassies"])

@router.get("/", response_model=List[Embassy])
async def get_embassies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    try:
        db = get_database()
        
        # 검색 조건 설정
        query = {}
        if search:
            query = {
                "$or": [
                    {"mission_name": {"$regex": search, "$options": "i"}},
                    {"address": {"$regex": search, "$options": "i"}}
                ]
            }
        
        print(f"MongoDB query: {query}")
        print(f"Skip: {skip}, Limit: {limit}")
        
        # 대사관 목록 조회
        cursor = db.embassies.find(query).skip(skip).limit(limit)
        embassies = []
        
        async for embassy in cursor:
            embassy["id"] = str(embassy["_id"])
            del embassy["_id"]  # _id 필드 제거
            embassies.append(Embassy(**embassy))
            
        print(f"Found {len(embassies)} embassies")
        
        return embassies
        
    except Exception as e:
        print(f"Error in get_embassies: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/count")
async def get_embassy_count(search: Optional[str] = Query(None)):
    try:
        db = get_database()
        
        query = {}
        if search:
            query = {
                "$or": [
                    {"mission_name": {"$regex": search, "$options": "i"}},
                    {"address": {"$regex": search, "$options": "i"}}
                ]
            }
        
        count = await db.embassies.count_documents(query)
        print(f"Total count: {count}")
        
        return {"count": count}
        
    except Exception as e:
        print(f"Error in get_embassy_count: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/{embassy_id}", response_model=Embassy)
async def get_embassy(embassy_id: str):
    try:
        db = get_database()
        
        embassy = await db.embassies.find_one({"_id": ObjectId(embassy_id)})
        if not embassy:
            raise HTTPException(
                status_code=404,
                detail="대사관을 찾을 수 없습니다."
            )
        
        embassy["id"] = str(embassy["_id"])
        del embassy["_id"]
        
        return Embassy(**embassy)
        
    except Exception as e:
        print(f"Error in get_embassy: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

# 테스트용 엔드포인트 추가
@router.get("/test/collections")
async def test_collections():
    """컬렉션 목록 확인용"""
    try:
        db = get_database()
        collections = await db.list_collection_names()
        return {"collections": collections}
    except Exception as e:
        return {"error": str(e)}

@router.get("/test/sample")
async def test_sample_data():
    """샘플 데이터 확인용"""
    try:
        db = get_database()
        # 첫 번째 문서 하나만 가져오기
        sample = await db.embassies.find_one()
        if sample:
            sample["_id"] = str(sample["_id"])
        return {"sample": sample}
    except Exception as e:
        return {"error": str(e)}