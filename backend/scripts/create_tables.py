import asyncio
import sys
import os

# 상위 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import create_mysql_tables, mysql_engine
from app.models.mysql_user import MySQLUser  # 테이블 모델 import

async def create_tables():
    """MySQL atlas 데이터베이스에 테이블들을 생성합니다."""
    try:
        print("🔧 MySQL 테이블 생성을 시작합니다...")
        
        # 테이블 생성
        await create_mysql_tables()
        
        print("✅ MySQL 테이블이 성공적으로 생성되었습니다!")
        
        # 생성된 테이블 확인
        async with mysql_engine.begin() as conn:
            result = await conn.execute("SHOW TABLES")
            tables = result.fetchall()
            
            print("\n📋 생성된 테이블 목록:")
            for table in tables:
                print(f"  - {table[0]}")
                
            # users 테이블 구조 확인
            if tables:
                result = await conn.execute("DESCRIBE users")
                columns = result.fetchall()
                print(f"\n📝 'users' 테이블 구조:")
                for col in columns:
                    print(f"  - {col[0]}: {col[1]} ({col[2]}, {col[3]}, {col[4]})")
        
    except Exception as e:
        print(f"❌ 테이블 생성 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_tables())
