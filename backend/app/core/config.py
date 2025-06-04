from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://2gyuho:***REMOVED***@devine.my/"
    database_name: str = "devine"
    
    class Config:
        env_file = ".env"

settings = Settings()
