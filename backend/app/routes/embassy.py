from fastapi import APIRouter, Query
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
    
    # 대사관 목록 조회
    cursor = db.embassies.find(query).skip(skip).limit(limit)
    embassies = []
    
    async for embassy in cursor:
        embassy["id"] = str(embassy["_id"])
        embassies.append(Embassy(**embassy))
    
    return embassies

@router.get("/count")
async def get_embassy_count(search: Optional[str] = Query(None)):
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
    return {"count": count}

@router.get("/{embassy_id}", response_model=Embassy)
async def get_embassy(embassy_id: str):
    db = get_database()
    
    embassy = await db.embassies.find_one({"_id": ObjectId(embassy_id)})
    if not embassy:
        raise HTTPException(
            status_code=404,
            detail="대사관을 찾을 수 없습니다."
        )
    
    embassy["id"] = str(embassy["_id"])
    return Embassy(**embassy)

from fastapi import HTTPException