# 관리자 권한 시스템 및 AlertLog 테이블 추가 스크립트
import asyncio
import sys
import os
from sqlalchemy import text

# 경로 설정
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import mysql_engine

async def add_admin_system():
    """관리자 권한 시스템 및 AlertLog 테이블 추가"""
    try:
        print("🔧 관리자 시스템 설정 중...")
        
        async with mysql_engine.begin() as conn:
            # 1. users 테이블에 is_admin 컬럼 추가 (이미 있으면 무시)
            try:
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_admin BOOLEAN DEFAULT FALSE
                """))
                print("✅ users 테이블에 is_admin 컬럼 추가 완료")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print("ℹ️ is_admin 컬럼이 이미 존재합니다")
                else:
                    print(f"⚠️ is_admin 컬럼 추가 중 오류: {e}")
            
            # 2. alert_logs 테이블 생성
            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS alert_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        alert_type VARCHAR(50) NOT NULL,
                        danger_type VARCHAR(100) NOT NULL,
                        danger_location VARCHAR(255),
                        danger_latitude FLOAT,
                        danger_longitude FLOAT,
                        user_latitude FLOAT,
                        user_longitude FLOAT,
                        distance_km FLOAT,
                        news_title VARCHAR(500),
                        news_content TEXT,
                        is_sent BOOLEAN DEFAULT FALSE,
                        error_message TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        INDEX idx_user_id (user_id),
                        INDEX idx_created_at (created_at),
                        INDEX idx_alert_type (alert_type),
                        INDEX idx_danger_type (danger_type)
                    )
                """))
                print("✅ alert_logs 테이블 생성 완료")
            except Exception as e:
                print(f"⚠️ alert_logs 테이블 생성 중 오류: {e}")
            
            # 3. 첫 번째 사용자를 관리자로 설정 (이미 사용자가 있는 경우)
            try:
                result = await conn.execute(text("SELECT id, email FROM users ORDER BY id LIMIT 1"))
                first_user = result.fetchone()
                
                if first_user:
                    await conn.execute(text("""
                        UPDATE users 
                        SET is_admin = TRUE 
                        WHERE id = :user_id
                    """), {"user_id": first_user[0]})
                    print(f"✅ 첫 번째 사용자 ({first_user[1]})를 관리자로 설정했습니다")
                else:
                    print("ℹ️ 등록된 사용자가 없습니다")
            except Exception as e:
                print(f"⚠️ 관리자 설정 중 오류: {e}")
            
            print("\n🎉 관리자 시스템 설정이 완료되었습니다!")
            print("📋 추가된 기능:")
            print("   - 사용자 관리자 권한 시스템")
            print("   - 알림 로그 저장 시스템")
            print("   - 관리자 대시보드 (/admin)")
            
    except Exception as e:
        print(f"❌ 설정 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(add_admin_system())
