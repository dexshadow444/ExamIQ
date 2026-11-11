"""
JM Vertex ExamIQ — FastAPI Backend Application Server
----------------------------------------------------
Provides RESTful API endpoints for the ExamIQ AI Examination & Learning Intelligence System.
Supports teaching progress locks, syllabus hierarchy, resource hub, question banking,
blueprint paper generation, answer script OCR & grading, marks management, student learning DNA,
remedial drill generation, vocational education modules, and administrative security audit trails.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from backend.config import settings
from backend.routers import (
    admin,
    auth,
    evaluations,
    homework,
    marks,
    papers,
    questions,
    remedial,
    reports,
    resources,
    students,
    syllabus,
    vocational,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for FastAPI startup and shutdown."""
    print("=" * 70)
    print(f"🚀 {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"📡 API Base URL: http://{settings.BACKEND_HOST}:{settings.BACKEND_PORT}{settings.API_V1_PREFIX}")
    print(f"📚 Interactive Swagger Docs: http://localhost:{settings.BACKEND_PORT}/docs")
    print(f"📄 ReDoc Alternative Docs: http://localhost:{settings.BACKEND_PORT}/redoc")
    print("=" * 70)
    yield
    print("🛑 ExamIQ FastAPI Backend Stopped")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
### JM Vertex ExamIQ — Backend REST API
Empowers Tamil Nadu State Board Class 12 Higher Secondary Examinations with:
* **Rule 1 Enforced**: Teaching Progress Lock preventing untaught syllabus from appearing in tests.
* **Bilingual Support**: Dual Tamil & English question papers, OCR rubrics, and LaTeX formulas.
* **AI Evaluation Engine**: Optical answer sheet scoring with mandatory teacher sign-off audit trail.
* **Student Learning DNA**: Question-level diagnostic tracking and automated micro-remedial drills.
    """,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS for frontend clients (Flask app on port 3000, Vite, or direct browser requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under standard /api/v1 prefix
api_routers = [
    auth.router,
    syllabus.router,
    resources.router,
    questions.router,
    papers.router,
    evaluations.router,
    marks.router,
    students.router,
    remedial.router,
    homework.router,
    vocational.router,
    reports.router,
    admin.router,
]

for r in api_routers:
    app.include_router(r, prefix=settings.API_V1_PREFIX)
    # Also mount directly under root for path flexibility
    app.include_router(r)


@app.get("/health", tags=["System Health"], summary="Service Health Check")
@app.get(f"{settings.API_V1_PREFIX}/health", tags=["System Health"], summary="API v1 Health Check")
async def health_check():
    """Returns the operational status of the ExamIQ backend."""
    return {
        "status": "healthy",
        "service": "JM Vertex ExamIQ Backend",
        "version": settings.VERSION,
        "apiPrefix": settings.API_V1_PREFIX,
        "database": "online",
        "corsAllowed": True
    }


@app.get("/", response_class=HTMLResponse, tags=["System Health"], summary="Backend Landing Page")
async def root():
    """Friendly HTML landing page displaying service status and links."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title>ExamIQ FastAPI Backend</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; line-height: 1.6; }}
            .container {{ max-width: 800px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #334155; }}
            h1 {{ color: #38bdf8; margin-top: 0; }}
            .badge {{ display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: #059669; color: #fff; font-weight: 600; font-size: 0.85rem; margin-bottom: 1rem; }}
            a {{ color: #38bdf8; text-decoration: none; font-weight: 500; }}
            a:hover {{ text-decoration: underline; }}
            ul {{ list-style-type: none; padding-left: 0; }}
            li {{ margin: 0.6rem 0; }}
            code {{ background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; color: #f472b6; }}
        </style>
    </head>
    <body>
        <div class="container">
            <span class="badge">ACTIVE &amp; ONLINE</span>
            <h1>JM Vertex ExamIQ — FastAPI Backend</h1>
            <p>The backend service for the ExamIQ AI Examination &amp; Learning Intelligence System is running and properly connected.</p>
            <h3>Quick Links &amp; Documentation</h3>
            <ul>
                <li>📖 <a href="/docs">Interactive Swagger API Documentation (/docs)</a></li>
                <li>📑 <a href="/redoc">Alternative ReDoc Documentation (/redoc)</a></li>
                <li>📋 <a href="/openapi.json">OpenAPI 3.0 Specification (/openapi.json)</a></li>
                <li>🩺 <a href="/health">Health Check Endpoint (/health)</a></li>
            </ul>
            <h3>Frontend Integration</h3>
            <p>Ensure the frontend configuration in <code>.env</code> points to: <code>API_BASE_URL=http://localhost:8000{settings.API_V1_PREFIX}</code></p>
        </div>
    </body>
    </html>
    """


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True
    )

