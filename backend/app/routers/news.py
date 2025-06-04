from fastapi import APIRouter

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/")
async def get_news():
    return {"message": "뉴스 목록을 조회합니다"}
