"""
Entrypoint script to run the ExamIQ FastAPI Backend Server.
Usage:
    python run_backend.py
"""

import sys
import uvicorn
from backend.config import settings

if __name__ == "__main__":
    print(f"Starting ExamIQ Backend Server on http://{settings.BACKEND_HOST}:{settings.BACKEND_PORT} ...")
    uvicorn.run(
        "backend.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True
    )

