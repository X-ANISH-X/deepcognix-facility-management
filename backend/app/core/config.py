import os # not required rn
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_USER: str = "root"
    DB_PASSWORD: str = "1234"
    DB_NAME: str = "deepcognix_db"
    DB_PORT: int = 3306
    
    # Security
    SECRET_KEY: str = "s1f4j325oj8kj39l48yq5ba0diy4wq93b4f85viuer32ty4fs9ye"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()