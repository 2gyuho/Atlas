import asyncio
import asyncmy
import sys
import os

# 상위 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings

async def create_database():
    """MySQL 서버에 atlas 데이터베이스를 생성합니다."""
    try:
        # 데이터베이스 없이 MySQL 서버에 연결
        connection = await asyncmy.connect(
            host=settings.mysql_host,
            user=settings.mysql_user,
            password=settings.mysql_password,
            port=settings.mysql_port
        )
        
        async with connection.cursor() as cursor:
            # atlas 데이터베이스 생성 (이미 존재하면 무시)
            await cursor.execute("CREATE DATABASE IF NOT EXISTS atlas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("✅ 'atlas' 데이터베이스가 성공적으로 생성되었습니다.")
            
            # 데이터베이스 목록 확인
            await cursor.execute("SHOW DATABASES")
            databases = await cursor.fetchall()
            print("\n📋 MySQL 서버의 데이터베이스 목록:")
            for db in databases:
                print(f"  - {db[0]}")
            
        await connection.ensure_closed()
        
    except Exception as e:
        print(f"❌ 데이터베이스 생성 중 오류 발생: {e}")
        print(f"   연결 정보: {settings.mysql_host}:{settings.mysql_port}")
        print(f"   사용자: {settings.mysql_user}")

if __name__ == "__main__":
    asyncio.run(create_database())
