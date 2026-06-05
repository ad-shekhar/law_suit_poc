"""
LegalOS — KPU Chambers AI Practice Operating System
FastAPI Backend — Main Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from src.config import settings
from src.api import matters, dashboard, strategy, hearings, invoices, users, ai_skills, audit

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 LegalOS API starting up...")
    logger.info(f"   Environment: {settings.environment}")
    logger.info(f"   AI Mock Mode: {settings.ai_mock_mode}")
    yield
    logger.info("🛑 LegalOS API shutting down...")


app = FastAPI(
    title="LegalOS API",
    description="KPU Chambers AI Practice Operating System — Human Generated, AI Assisted",
    version="0.1.0-poc",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(matters.router, prefix="/api/v1", tags=["Matters"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(strategy.router, prefix="/api/v1", tags=["Strategy Notes"])
app.include_router(hearings.router, prefix="/api/v1", tags=["Hearings"])
app.include_router(invoices.router, prefix="/api/v1", tags=["Invoices"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(ai_skills.router, prefix="/api/v1", tags=["AI Skills"])
app.include_router(audit.router, prefix="/api/v1", tags=["Audit"])


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "LegalOS API",
        "version": "0.1.0-poc",
        "ai_mock_mode": settings.ai_mock_mode,
    }
