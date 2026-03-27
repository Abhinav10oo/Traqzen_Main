# TelematicsHub

An IoT-based smart fleet telematics web application for real-time vehicle monitoring, driver management, document tracking, and maintenance scheduling.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)

---

## Project Overview

TelematicsHub is a full-stack web platform built for fleet owners and operators. It connects to IoT devices (ESP32 / Arduino) installed in vehicles via MQTT and displays live telemetry data — GPS location, speed, fuel level, engine temperature, and alcohol sensor readings — on a real-time dashboard.

When real IoT devices are not connected, the application runs in **Demo Mode**, where a built-in live simulator updates all 6 vehicles with realistic, continuously-changing data every 3 seconds so the UI can be tested as if live hardware were present.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI component framework |
| Vite | 7.x | Build tool and dev server |
| React Router DOM | 7.x | Client-side routing |
| Recharts | 3.x | Charts (area, bar, line, pie, radial) |
| Firebase SDK | 12.x | Authentication + Firestore database |
| Lucide React | 0.57x | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.115 | REST API framework |
| Uvicorn | 0.32 | ASGI server |
| SQLAlchemy | 2.0 | ORM / database access |
| SQLite | built-in | Default local database |
| Paho MQTT | 2.1 | MQTT client — bridges IoT data into the DB |
| APScheduler | 3.10 | Background jobs (document expiry checks) |
| Python-JOSE | 3.3 | JWT authentication tokens |
| Passlib + bcrypt | 1.7 / 4.x | Password hashing |
| Pydantic v2 | 2.10 | Request/response validation and settings |
| python-multipart | 0.0.20 | File upload handling |
| Pillow | 11.x | Image processing for uploaded documents |

### Cloud Services

| Service | Purpose |
|---|---|
| Firebase Authentication | User sign-up, login, session management |
| Firebase Firestore | NoSQL database for dashboard demo data |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│                                                         │
│  Landing → Login/Signup → Dashboard (protected routes)  │
│                                                         │
│  DataContext ──► Firebase Firestore (demo data)         │
│               └► liveSimulator  (3-second ticker)       │
│                                                         │
│  Pages: Overview · Vehicles · Analytics · Reports       │
│         Maintenance · Documents · Settings              │
└─────────────────┬───────────────────────────────────────┘
                  │ REST  /api/*
                  ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI Backend  (:8000)                   │
│                                                         │
│  Routers: auth · vehicles · sensor_data · alerts        │
│           drivers · trips · maintenance · documents      │
│           analytics                                     │
│                                                         │
│  Services: alert_service (threshold checking)           │
│  Scheduler: document expiry alerts (every 24 h)         │
│                                                         │
│  SQLite DB  ◄──► SQLAlchemy ORM                        │
│                                                         │
│  MQTT Client (paho) ◄── ESP32/Arduino IoT devices       │
│    Topics:                                              │
│      telematicshub/vehicles/{id}/data   → sensor data  │
│      telematicshub/vehicles/{id}/status → heartbeat    │
└─────────────────────────────────────────────────────────┘
```

### IoT Device Payload (ESP32 → MQTT)

```json
{
  "lat":     19.076,
  "lng":     72.877,
  "speed":   48.5,
  "fuel":    72,
  "temp":    88,
  "alcohol": 0.0,
  "rpm":     2400,
  "token":   "<device_token>"
}
```

---

## Features

### Dashboard Pages

| Page | What it shows |
|---|---|
| **Overview** | Fleet summary cards, live vehicle telemetry ticker (6 vehicles, updates every 3 s), fuel trend chart, monthly trips bar chart, active alerts list |
| **Vehicles** | Full vehicle list with search/filter, status badges, detailed modal with all sensor readings, fuel bar, insurance/pollution dates |
| **Analytics** | Speed profile chart, fuel efficiency trend, driver score bar chart, fleet status pie chart, alert-type breakdown |
| **Reports** | Paginated trip history table with distance, duration, fuel used, average speed |
| **Maintenance** | Service records with status (upcoming / overdue / completed), cost tracking |
| **Documents** | Insurance, pollution certificate, fitness certificate status with expiry warnings |
| **Settings** | User profile, notification preferences, alert thresholds |

### Live Simulator (Demo Mode)

When Firebase is unreachable or Firestore is empty, the app runs with local fake data and a live simulator that:

- **Every 3 seconds** updates all 6 vehicles:
  - Active vehicles: speed (20–80 km/h, smooth drift), fuel drain, engine temp (tracks speed), GPS drift, odometer increment
  - Idle vehicles: engine cools, minimal fuel drain
  - Maintenance/Offline: no changes
- **Auto-generates alerts** when thresholds are crossed:
  - Fuel < 25% → Warning alert; < 15% → Danger alert
  - Engine temp > 92°C → Warning; > 100°C → Danger
  - Speed > 90 km/h → Speed alert
- **Slides the speed chart** forward in real time (14-point rolling window)
- **LIVE badge** in the Overview header shows a pulsing green dot and "updated Xs ago"

### Backend Capabilities

- JWT authentication (access + refresh tokens)
- Role-based access control (owner / driver)
- MQTT bridge — live IoT data saved directly to SQLite
- Automatic alert generation on sensor data ingestion
- Document expiry reminders (30, 7, 1 days before expiry) via scheduler
- File upload for vehicle documents (PDF, JPG, PNG — max 10 MB)
- RESTful API with automatic Swagger docs at `/docs`

---

## Project Structure

```
final_project/
├── backend/                        # FastAPI backend
│   ├── main.py                     # App entry point, lifespan, CORS, routers
│   ├── database.py                 # SQLAlchemy engine + session
│   ├── core/
│   │   ├── config.py               # Settings (env vars, thresholds)
│   │   ├── security.py             # JWT + password hashing
│   │   └── dependencies.py         # FastAPI dependency injection
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── vehicle.py
│   │   ├── sensor_data.py
│   │   ├── alert.py
│   │   ├── trip.py
│   │   ├── maintenance.py
│   │   ├── document.py
│   │   └── driver_profile.py
│   ├── routers/                    # Route handlers (one file per resource)
│   │   ├── auth.py
│   │   ├── vehicles.py
│   │   ├── sensor_data.py
│   │   ├── alerts.py
│   │   ├── drivers.py
│   │   ├── trips.py
│   │   ├── maintenance.py
│   │   ├── documents.py
│   │   └── analytics.py
│   ├── schemas/                    # Pydantic request/response schemas
│   ├── services/
│   │   └── alert_service.py        # Threshold checking + expiry alerts
│   ├── mqtt/
│   │   └── mqtt_handler.py         # MQTT subscriber bridge
│   ├── requirements.txt
│   └── telematicshub.db            # SQLite database file (auto-created)
│
└── telematicshub/                  # React + Vite frontend
    ├── src/
    │   ├── App.jsx                 # Router, providers, protected routes
    │   ├── firebase.js             # Firebase app init (auth + firestore)
    │   ├── contexts/
    │   │   ├── AuthContext.jsx     # Firebase auth state
    │   │   └── DataContext.jsx     # Data loading + live simulator wiring
    │   ├── data/
    │   │   └── fakeData.js         # Static demo data (vehicles, alerts, etc.)
    │   ├── utils/
    │   │   ├── liveSimulator.js    # Live data simulation engine
    │   │   └── seedFirestore.js    # One-time Firestore seeder
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       └── dashboard/
    │           ├── DashboardLayout.jsx
    │           ├── Overview.jsx
    │           ├── VehicleList.jsx
    │           ├── Analytics.jsx
    │           ├── Reports.jsx
    │           ├── Maintenance.jsx
    │           ├── Documents.jsx
    │           ├── UploadDocuments.jsx
    │           └── Settings.jsx
    ├── package.json
    └── vite.config.js
```

---

## How to Run

### Prerequisites

- **Node.js** v18 or higher
- **Python** 3.10 or higher
- **pip** (Python package manager)

---

### 1. Run the Frontend

```bash
# Navigate to the frontend folder
cd final_project/telematicshub

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at: **http://localhost:5173**

To create a production build:

```bash
npm run build
npm run preview   # preview the built app locally
```

---

### 2. Run the Backend

```bash
# Navigate to the backend folder
cd final_project/backend

# (Recommended) Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: **http://localhost:8000**
Interactive API docs (Swagger UI): **http://localhost:8000/docs**
Alternative docs (ReDoc): **http://localhost:8000/redoc**

> The SQLite database (`telematicshub.db`) and the `uploads/` folder are created automatically on first run. Demo users and vehicles are seeded automatically if the database is empty.

---

### 3. Firebase Setup (for Authentication + Firestore)

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Add a **Web App** to the project
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Firestore Database** → Start in test mode
5. Copy your config values into `telematicshub/src/firebase.js`:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

> If Firebase is not configured, the app automatically falls back to local demo data with the live simulator running — no setup needed to test the UI.

---

### 4. MQTT Setup (for Real IoT Devices — Optional)

Install and start an MQTT broker (e.g. Mosquitto):

```bash
# Windows — download from https://mosquitto.org/download/
mosquitto

# macOS
brew install mosquitto && brew services start mosquitto

# Linux
sudo apt install mosquitto mosquitto-clients && sudo systemctl start mosquitto
```

Create a `.env` file in the `backend/` folder:

```env
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

Devices publish JSON to the topic:
```
telematicshub/vehicles/{vehicle_id}/data
```

---

### 5. Backend Environment Variables (Optional)

Create `backend/.env` to override defaults:

```env
DATABASE_URL=sqlite:///./telematicshub.db
SECRET_KEY=your-strong-secret-key-here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883

FUEL_ALERT_THRESHOLD=25
ENGINE_TEMP_MAX=90
SPEED_LIMIT=100
ALCOHOL_THRESHOLD=0.03
```

---

## Demo Credentials

These accounts are seeded automatically when the backend starts with an empty database:

| Role | Email | Password |
|---|---|---|
| Fleet Owner | `owner@telematicshub.com` | `password123` |
| Driver | `priya@telematicshub.com` | `password123` |
| Driver | `ravi@telematicshub.com` | `password123` |
| Driver | `sneha@telematicshub.com` | `password123` |

> Note: These accounts are for the **FastAPI backend**. For the Firebase-authenticated frontend, create an account via the Sign Up page.

---

## API Reference

All endpoints are prefixed with `/api`. Full interactive documentation is at `/docs`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/vehicles` | List all vehicles |
| POST | `/api/vehicles` | Register a new vehicle |
| GET | `/api/vehicles/{id}` | Get vehicle details |
| POST | `/api/sensor-data` | Ingest IoT sensor reading |
| GET | `/api/sensor-data/{vehicle_id}` | Get sensor history |
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/{id}/resolve` | Mark alert as resolved |
| GET | `/api/trips` | List trips |
| GET | `/api/maintenance` | List maintenance records |
| POST | `/api/documents` | Upload a document |
| GET | `/api/analytics/summary` | Fleet analytics summary |
| GET | `/health` | Health check |

---

## Demo Vehicles

Six vehicles are pre-loaded in demo mode:

| ID | Registration | Model | Driver | Status |
|---|---|---|---|---|
| V001 | MH 12 AB 1234 | Tata Nexon (2022) | Arjun Sharma | Active |
| V002 | DL 5S CD 5678 | Mahindra Scorpio (2021) | Priya Nair | Idle |
| V003 | KA 09 EF 9012 | Hyundai i20 (2023) | Ravi Kumar | Active |
| V004 | GJ 01 GH 3456 | Maruti Swift (2020) | Sneha Patel | Maintenance |
| V005 | TN 22 IJ 7890 | Toyota Innova (2022) | Kiran Reddy | Active |
| V006 | RJ 14 KL 2345 | Force Traveller (2019) | Mohammed Ali | Offline |
