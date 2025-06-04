from fastapi import APIRouter

router = APIRouter(prefix="/embassies", tags=["embassies"])

@router.get("/")
async def get_embassies():
    return {"message": "대사관 목록을 조회합니다"}

@router.get("/{embassy_id}")
async def get_embassy(embassy_id: int):
    return {"embassy_id": embassy_id, "message": "특정 대사관 정보"}

@router.post("/")
async def create_embassy(embassy_data: dict):
    return {"message": "새 대사관 정보가 생성되었습니다", "data": embassy_data}
