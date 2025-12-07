from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_ENV: str = "development"
    PORT: int = 8000
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "careercircle"
    JWT_SECRET: str = "secure-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5137"]

    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()