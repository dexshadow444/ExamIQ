"""
Backend Configuration Settings
"""

import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "JM Vertex ExamIQ — AI Examination & Learning Intelligence API"
    VERSION: str = "2.1.0"
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

    # CORS Settings - Allow frontend running on any local port (e.g. 3000, 5000, 8080)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]


settings = Settings()

