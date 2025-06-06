import asyncio
import sys
import os

# 상위 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import mysql_engine
from sqlalchemy import text

async def check_users():
    """MySQL atlas 데이터베이스의 사용자 정보를 확인합니다."""
    try:
        print("👥 사용자 정보 확인 중...")
        
        async with mysql_engine.begin() as conn:
            # 모든 사용자 조회
            result = await conn.execute(text("SELECT id, email, username, created_at FROM users"))
            users = result.fetchall()
            
            print(f"\n📊 총 {len(users)}명의 사용자가 등록되어 있습니다:")
            for user in users:
                print(f"  ID: {user[0]}, Email: {user[1]}, Username: {user[2]}, Created: {user[3]}")
                
            # 특정 사용자의 해시된 비밀번호 확인
            if users:
                email = users[0][1]  # 첫 번째 사용자의 이메일
                result = await conn.execute(text("SELECT hashed_password FROM users WHERE email = :email"), {"email": email})
                password_hash = result.fetchone()
                print(f"\n🔐 {email} 사용자의 해시된 비밀번호: {password_hash[0][:50]}...")
        
    except Exception as e:
        print(f"❌ 사용자 확인 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_users())
