from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB 설정 (기존 - 대사관, 뉴스 등)
    mongodb_url: str = "mongodb://2gyuho:***REMOVED***@devine.my/"
    database_name: str = "devine"
    
    # MySQL 설정 (새로 추가 - 사용자 정보)
    mysql_host: str = "devine.my"
    mysql_user: str = "root"
    mysql_password: str = "***REMOVED***"
    mysql_database: str = "atlas"
    mysql_port: int = 3306
      # JWT 설정
    secret_key: str = "***REMOVED***"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google Maps API 설정
    geo_api_key: str = "your_google_maps_api_key_here"
    
    @property
    def mysql_url(self) -> str:
        return f"mysql+asyncmy://{self.mysql_user}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
    
    class Config:
        env_file = ".env"

settings = Settings()
