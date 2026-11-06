"""
LegalOS Backend — Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    environment: str = "development"
    secret_key: str = "dev-secret-key-change-in-production"
    default_firm_id: str = "7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab"
    default_password: str = "demo1234"
    
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    
    # Google Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    
    # AI Settings
    ai_mock_mode: bool = True  # Toggle to False when ready for real AI calls
    
    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://legalos.vercel.app",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()
