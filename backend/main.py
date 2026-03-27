"""
TelematicsHub — FastAPI Backend
================================
Run with:  uvicorn main:app --reload --host 0.0.0.0 --port 8000
Docs at:   http://localhost:8000/docs
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from core.config import settings
import core.firebase_admin  # noqa: F401 — initialises Firebase Admin SDK on import

# ── Routers ──────────────────────────────────────────────────────────────────
from routers import vehicles, sensor_data, alerts, documents, maintenance, trips, analytics, drivers, iot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("main")

# ── Scheduler (document expiry checks) ───────────────────────────────────────
scheduler = BackgroundScheduler()
mqtt_client = None


def run_document_expiry_check():
    """Scheduled job: fire expiry alerts for documents."""
    from services.alert_service import check_document_expiry_alerts
    check_document_expiry_alerts()
    logger.info("Document expiry check completed")


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global mqtt_client

    # Start MQTT bridge
    from mqtt.mqtt_handler import start_mqtt_client
    mqtt_client = start_mqtt_client()

    # Start scheduler
    scheduler.add_job(run_document_expiry_check, "interval", hours=24, id="doc_expiry")
    scheduler.start()
    logger.info("Scheduler started.")

    yield  # ← app runs here

    # Shutdown
    scheduler.shutdown(wait=False)
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
    logger.info("Backend shutdown complete.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="IoT-Based Smart Telematics System — REST API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include routers ───────────────────────────────────────────────────────────
PREFIX = "/api"
app.include_router(vehicles.router,    prefix=PREFIX)
app.include_router(sensor_data.router, prefix=PREFIX)
app.include_router(alerts.router,      prefix=PREFIX)
app.include_router(documents.router,   prefix=PREFIX)
app.include_router(maintenance.router, prefix=PREFIX)
app.include_router(trips.router,       prefix=PREFIX)
app.include_router(analytics.router,   prefix=PREFIX)
app.include_router(drivers.router,     prefix=PREFIX)
app.include_router(iot.router,         prefix=PREFIX)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "app":     settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs":    "/docs",
        "health":  "/health",
    }
