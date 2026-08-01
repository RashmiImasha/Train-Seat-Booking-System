from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
 
 
class Settings(BaseSettings):
     
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
 
    database_url: str 
    app_env: str = "development"

    jwt_secret_key: str = "dev-only-secret-change-in-a-real-deployment"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 8  # 8 hours
 
 
@lru_cache
def get_settings() -> Settings:
        
    return Settings()

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"