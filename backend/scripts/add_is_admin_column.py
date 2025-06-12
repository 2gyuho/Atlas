# 수동으로 is_admin 컬럼 추가 스크립트
import asyncio
import sys
import os
from sqlalchemy import text

# 경로 설정
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import mysql_engine

async def add_is_admin_column():
    """is_admin 컬럼을 users 테이블에 추가"""
    try:
        print("🔧 is_admin 컬럼 추가 중...")
        
        async with mysql_engine.begin() as conn:
            # 1. 현재 테이블 구조 확인
            result = await conn.execute(text("DESCRIBE users"))
            columns = result.fetchall()
            print("현재 users 테이블 구조:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")
            
            # 2. is_admin 컬럼이 있는지 확인
            column_names = [col[0] for col in columns]
            if 'is_admin' in column_names:
                print("✅ is_admin 컬럼이 이미 존재합니다")
            else:
                # 3. is_admin 컬럼 추가
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_admin BOOLEAN DEFAULT FALSE
                """))
                print("✅ is_admin 컬럼 추가 완료")
            
            # 4. 첫 번째 사용자를 관리자로 설정
            result = await conn.execute(text("SELECT id, email FROM users ORDER BY id LIMIT 1"))
            first_user = result.fetchone()
            
            if first_user:
                await conn.execute(text("""
                    UPDATE users 
                    SET is_admin = TRUE 
                    WHERE id = :user_id
                """), {"user_id": first_user[0]})
                print(f"✅ 첫 번째 사용자 ({first_user[1]})를 관리자로 설정했습니다")
            
            # 5. 업데이트된 테이블 구조 확인
            result = await conn.execute(text("DESCRIBE users"))
            columns = result.fetchall()
            print("\n업데이트된 users 테이블 구조:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")
            
            print("\n🎉 is_admin 컬럼 추가가 완료되었습니다!")
            
    except Exception as e:
        print(f"❌ 컬럼 추가 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(add_is_admin_column())
