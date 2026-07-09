from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB 설정 (기존 - 대사관, 뉴스 등)
    mongodb_url: str
    database_name: str = ""

    # MySQL 설정 (새로 추가 - 사용자 정보)
    mysql_host: str = "localhost"
    mysql_user: str = "root"
    mysql_password: str
    mysql_database: str = "atlas"
    mysql_port: int = 3306
      # JWT 설정
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
      # Google Maps API 설정
    geo_api_key: str = ""
      # 이메일 설정 (알림용) - 네이버 SMTP
    smtp_server: str = "smtp.naver.com"
    smtp_port: int = 587
    email_user: str = ""
    email_password: str = ""
    
    @property
    def mysql_url(self) -> str:
        return f"mysql+asyncmy://{self.mysql_user}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
    
    class Config:
        env_file = ".env"

settings = Settings()
