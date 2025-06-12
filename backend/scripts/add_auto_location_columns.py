"""
MySQL 사용자 테이블에 자동 위치 추적 관련 컬럼 추가
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import create_mysql_engine
from sqlalchemy import text

async def add_auto_location_columns():
    """사용자 테이블에 자동 위치 추적 관련 컬럼들 추가"""
    engine = create_mysql_engine()
    
    try:
        async with engine.begin() as conn:
            # 이미 컬럼이 있는지 확인
            check_columns = await conn.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'atlas' 
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('auto_location_tracking', 'location_update_frequency')
            """))
            
            existing_columns = [row[0] for row in check_columns.fetchall()]
            
            # 필요한 컬럼들을 하나씩 추가
            columns_to_add = [
                ("auto_location_tracking", "BOOLEAN DEFAULT FALSE"),
                ("location_update_frequency", "INT DEFAULT 300")
            ]
            
            for column_name, column_def in columns_to_add:
                if column_name not in existing_columns:
                    alter_query = f"ALTER TABLE users ADD COLUMN {column_name} {column_def}"
                    await conn.execute(text(alter_query))
                    print(f"✅ {column_name} 컬럼이 추가되었습니다.")
                else:
                    print(f"⚠️ {column_name} 컬럼이 이미 존재합니다.")
            
            print("✅ 자동 위치 추적 관련 컬럼 업데이트 완료!")
            
    except Exception as e:
        print(f"❌ 테이블 업데이트 실패: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_auto_location_columns())
