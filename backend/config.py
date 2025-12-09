from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    APP_ENV: str = "development"
    PORT: int = 8000
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "careercircle"
    JWT_SECRET: str = "secure-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5137", "http://localhost:5138"]
    
    # Email/SMTP settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@careercircle.app"
    SMTP_FROM_NAME: str = "CareerCircle"
    EMAIL_NOTIFICATIONS_ENABLED: bool = False  # Set to True and configure SMTP to enable

    class Config:
        env_file = "backend/.env"

@lru_cache
def get_settings():
    return Settings()