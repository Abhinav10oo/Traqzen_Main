"""
TelematicsHub — FastAPI Backend (Local / Offline Mode)
======================================================
Run with:  uvicorn main:app --reload --host 0.0.0.0 --port 8000
Docs at:   http://localhost:8000/docs

All data is stored in a local SQLite file (telematicshub.db).
No Firebase or internet connection required.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from core.config import settings
from core.database import init_db

# ── Routers ───────────────────────────────────────────────────────────────────
from routers import (
    auth, vehicles, sensor_data, alerts, documents,
    maintenance, trips, analytics, drivers, iot,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("main")

scheduler = BackgroundScheduler()


def run_document_expiry_check():
    from services.alert_service import check_document_expiry_alerts
    check_document_expiry_alerts()
    logger.info("Document expiry check completed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise SQLite (creates tables if missing)
    init_db()
    logger.info("SQLite database ready.")

    scheduler.add_job(run_document_expiry_check, "interval", hours=24, id="doc_expiry")
    scheduler.start()
    logger.info("Scheduler started.")

    yield

    scheduler.shutdown(wait=False)
    logger.info("Backend shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="IoT-Based Smart Telematics System — Local Offline API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # local dev — all origins allowed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api"
app.include_router(auth.router,        prefix=PREFIX)
app.include_router(vehicles.router,    prefix=PREFIX)
app.include_router(sensor_data.router, prefix=PREFIX)
app.include_router(alerts.router,      prefix=PREFIX)
app.include_router(documents.router,   prefix=PREFIX)
app.include_router(maintenance.router, prefix=PREFIX)
app.include_router(trips.router,       prefix=PREFIX)
app.include_router(analytics.router,   prefix=PREFIX)
app.include_router(drivers.router,     prefix=PREFIX)
app.include_router(iot.router,         prefix=PREFIX)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION, "mode": "local-sqlite"}


@app.get("/", tags=["Root"])
def root():
    return {"message": f"Welcome to {settings.APP_NAME} API (local mode)", "docs": "/docs"}
