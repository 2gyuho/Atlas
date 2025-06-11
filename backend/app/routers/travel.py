from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime

from ..core.database import get_mysql_session
from ..models.travel import Travel
from ..schemas.travel import TravelCreate, TravelUpdate, TravelResponse
from ..core.security import get_current_user
from ..models.mysql_user import MySQLUser

router = APIRouter(prefix="/api/travels", tags=["travels"])

@router.post("/", response_model=TravelResponse)
async def create_travel(
    travel_data: TravelCreate,
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """새로운 여행계획 생성"""
    # 출발일이 귀국일보다 이전인지 확인
    if travel_data.departure_date >= travel_data.return_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="출발일은 귀국일보다 이전이어야 합니다."
        )
    
    # 새 여행계획 생성
    db_travel = Travel(
        title=travel_data.title,
        country=travel_data.country,
        city=travel_data.city,
        departure_date=travel_data.departure_date,
        return_date=travel_data.return_date,
        stopovers=travel_data.stopovers,
        notes=travel_data.notes,
        travel_items=travel_data.travel_items,
        user_email=current_user.email
    )
    
    db.add(db_travel)
    await db.commit()
    await db.refresh(db_travel)
    
    return db_travel

@router.get("/", response_model=List[TravelResponse])
async def get_travels(
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """현재 사용자의 모든 여행계획 조회"""
    result = await db.execute(
        select(Travel).where(Travel.user_email == current_user.email).order_by(Travel.created_at.desc())
    )
    travels = result.scalars().all()
    return travels

@router.get("/{travel_id}", response_model=TravelResponse)
async def get_travel(
    travel_id: int,
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """특정 여행계획 조회"""
    result = await db.execute(
        select(Travel).where(
            Travel.id == travel_id,
            Travel.user_email == current_user.email
        )
    )
    travel = result.scalar_one_or_none()
    
    if not travel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="여행계획을 찾을 수 없습니다."
        )
    
    return travel

@router.put("/{travel_id}", response_model=TravelResponse)
async def update_travel(
    travel_id: int,
    travel_data: TravelUpdate,
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """여행계획 수정"""
    result = await db.execute(
        select(Travel).where(
            Travel.id == travel_id,
            Travel.user_email == current_user.email
        )
    )
    travel = result.scalar_one_or_none()
    
    if not travel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="여행계획을 찾을 수 없습니다."
        )
    
    # 업데이트할 필드만 변경
    update_data = travel_data.dict(exclude_unset=True)
    
    # 날짜 유효성 검사
    departure_date = update_data.get("departure_date", travel.departure_date)
    return_date = update_data.get("return_date", travel.return_date)
    
    if departure_date >= return_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="출발일은 귀국일보다 이전이어야 합니다."
        )
    
    for field, value in update_data.items():
        setattr(travel, field, value)
    
    travel.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(travel)
    
    return travel

@router.delete("/{travel_id}")
async def delete_travel(
    travel_id: int,
    current_user: MySQLUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_mysql_session)
):
    """여행계획 삭제"""
    result = await db.execute(
        select(Travel).where(
            Travel.id == travel_id,
            Travel.user_email == current_user.email
        )
    )
    travel = result.scalar_one_or_none()
    
    if not travel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="여행계획을 찾을 수 없습니다."
        )
    
    await db.delete(travel)
    await db.commit()
    
    return {"message": "여행계획이 삭제되었습니다."}
