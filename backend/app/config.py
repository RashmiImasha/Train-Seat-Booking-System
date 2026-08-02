from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
 
 
class Settings(BaseSettings):
     
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
 
    database_url: str 
    app_env: str 

    jwt_secret_key: str = "dev-only-secret-change-in-a-real-deployment"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 8  # 8 hours

    cors_allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
 
 
@lru_cache
def get_settings() -> Settings:
        
    return Settings()

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"