from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.user import UserCreate, UserLogin, User, Token
from ..models.mysql_user import MySQLUser
from ..core.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from ..core.database import get_mysql_session

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=User)
async def register(user: UserCreate, db: AsyncSession = Depends(get_mysql_session)):
    # 이메일 중복 확인
    result = await db.execute(select(MySQLUser).where(MySQLUser.email == user.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다."
        )
    
    # 사용자명 중복 확인
    result = await db.execute(select(MySQLUser).where(MySQLUser.username == user.username))
    existing_username = result.scalar_one_or_none()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용중인 사용자명입니다."
        )
    
    # 비밀번호 해시화
    hashed_password = get_password_hash(user.password)
    
    # 사용자 생성
    new_user = MySQLUser(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return User(
        id=str(new_user.id),
        email=new_user.email,
        username=new_user.username,
        created_at=new_user.created_at
    )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: AsyncSession = Depends(get_mysql_session)):
    # 사용자 찾기
    result = await db.execute(select(MySQLUser).where(MySQLUser.email == user_credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}