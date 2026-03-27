# TelematicsHub — Complete Project Documentation

> IoT-Based Smart Fleet Telematics & Vehicle Monitoring System

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Complete Folder Structure](#3-complete-folder-structure)
4. [Technology Stack](#4-technology-stack)
5. [Backend — FastAPI](#5-backend--fastapi)
   - [Entry Point (main.py)](#51-entry-point-mainpy)
   - [Core Module](#52-core-module)
   - [Routers](#53-routers)
   - [Services](#54-services)
   - [MQTT Handler](#55-mqtt-handler)
   - [Database Schema (schema.sql)](#56-database-schema-schemasql)
   - [Environment Variables](#57-environment-variables)
   - [Python Dependencies](#58-python-dependencies)
6. [Frontend — React + Vite](#6-frontend--react--vite)
   - [Entry Points](#61-entry-points)
   - [Firebase Configuration](#62-firebase-configuration)
   - [React Router (App.jsx)](#63-react-router-appjsx)
   - [Contexts (State Management)](#64-contexts-state-management)
   - [Pages](#65-pages)
   - [Components](#66-components)
   - [Utilities](#67-utilities)
   - [Demo Data (fakeData.js)](#68-demo-data-fakedatajs)
   - [npm Dependencies](#69-npm-dependencies)
7. [Firebase Services Used](#7-firebase-services-used)
8. [Firestore Collections](#8-firestore-collections)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Alert Engine Logic](#11-alert-engine-logic)
12. [MQTT / IoT Data Flow](#12-mqtt--iot-data-flow)
13. [Live Demo Mode vs Real Mode](#13-live-demo-mode-vs-real-mode)
14. [User Roles](#14-user-roles)
15. [How to Run the Project](#15-how-to-run-the-project)
16. [Design & UI Choices](#16-design--ui-choices)
17. [Data Flow — End to End](#17-data-flow--end-to-end)

---

## 1. Project Overview

**TelematicsHub** is a full-stack web application designed for **real-time fleet monitoring and management**. It targets small fleet operators (especially in India) who need to track vehicle health, driver behavior, compliance documents, and maintenance — all from one dashboard.

### What It Does

| Feature | Description |
|---|---|
| Real-time GPS tracking | Live vehicle location via IoT/GPS sensors |
| Sensor monitoring | Fuel level, engine temperature, RPM, speed |
| Smart alerts | Auto-generated alerts for low fuel, overheating, speed violations, document expiry |
| Document vault | Upload and track insurance, PUC, RC, fitness certificates |
| Maintenance scheduling | Log and track service tasks per vehicle |
| Trip reports | Trip history with distance, duration, fuel used, driver scores |
| Analytics | Charts for speed profile, fuel trend, driver performance scores |
| Role-based access | Separate Owner and Driver views |
| Live demo mode | Simulated real-time telemetry without backend |

### Target Users

- **Fleet Owners** — manage vehicles, drivers, documents, maintenance, view analytics
- **Drivers** — view their assigned vehicle, trips, documents, update profile

---

## 2. Architecture Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                         IoT Hardware Layer                          │
│          ESP32 / Arduino → GPS, Fuel, Temp sensors                  │
│               Publishes JSON via MQTT every ~5 seconds              │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ MQTT (paho)
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                   Backend — FastAPI (Python)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ MQTT Handler│  │  REST API    │  │   APScheduler (daily)    │  │
│  │ (bridge)    │  │  /api/...    │  │   doc expiry checks      │  │
│  └──────┬──────┘  └──────┬───────┘  └──────────────────────────┘  │
│         │                │                                          │
│         └────────────────▼──────────────────────────────────────── │
│                   Firebase Admin SDK                                │
│                   Reads/Writes Firestore                            │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ Firestore
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│               Firebase (Google Cloud)                               │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│   │  Firestore   │  │  Auth        │  │  Firebase Storage     │  │
│   │  (NoSQL DB)  │  │  (Email/PW)  │  │  (File uploads)       │  │
│   └──────────────┘  └──────────────┘  └───────────────────────┘  │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ Firebase SDK (client)
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                   Frontend — React (Vite)                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │  Landing   │  │  Auth      │  │  Dashboard │  │  Charts    │  │
│  │  Page      │  │  Login/    │  │  Pages     │  │  (Recharts)│  │
│  │            │  │  Signup    │  │            │  │            │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Complete Folder Structure

```
d:\final_project/
│
├── package.json                    ← Root npm scripts (runs frontend + backend together)
├── package-lock.json
├── .gitignore
├── Prompt.pdf                      ← Original project specification document
├── TelematicsHub_Fix_Instructions.md  ← Internal migration guide (13 phases)
│
├── .vscode/
│   └── settings.json              ← VSCode color theme customization
│
├── .claude/
│   └── settings.local.json        ← Claude Code permissions config
│
│── backend/                       ← FastAPI Python Backend
│   ├── main.py                    ← App entry point, CORS, routers, lifespan
│   ├── requirements.txt           ← Python dependencies
│   ├── .env                       ← Active environment variables (gitignored)
│   ├── .env.example               ← Template for environment variables
│   ├── .gitignore
│   ├── schema.sql                 ← PostgreSQL schema (documentation/reference)
│   ├── test_api.py                ← Smoke tests for the API
│   ├── telematicshub.db           ← SQLite database (auto-created, dev fallback)
│   ├── firebase_admin_key.json    ← Firebase service account key (gitignored)
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              ← Pydantic settings (reads .env)
│   │   ├── dependencies.py        ← FastAPI dependency injection (auth)
│   │   └── firebase_admin.py      ← Firebase Admin SDK initializer
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── vehicles.py            ← CRUD for vehicles
│   │   ├── sensor_data.py         ← Ingest + query sensor readings
│   │   ├── alerts.py              ← Alert management
│   │   ├── documents.py           ← Document metadata CRUD
│   │   ├── maintenance.py         ← Maintenance task CRUD
│   │   ├── trips.py               ← Trip log CRUD
│   │   ├── analytics.py           ← Fleet KPIs, fuel trend, speed profile
│   │   └── drivers.py             ← Driver profiles
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── alert_service.py       ← Alert engine (threshold checks + doc expiry)
│   │
│   ├── mqtt/
│   │   ├── __init__.py
│   │   └── mqtt_handler.py        ← MQTT subscriber → Firestore bridge
│   │
│   └── venv/                      ← Python virtual environment (gitignored)
│
└── telematicshub/                 ← React Frontend (Vite)
    ├── index.html                 ← HTML shell (mounts React root)
    ├── vite.config.js             ← Vite build config
    ├── package.json               ← npm dependencies
    ├── eslint.config.js           ← ESLint rules
    ├── .env                       ← Firebase keys (gitignored)
    ├── .gitignore
    ├── firebase.json              ← Firebase Hosting config
    ├── .firebaserc                ← Firebase project alias
    ├── README.md
    │
    ├── public/
    │   └── logoF.png              ← App logo (public asset)
    │
    ├── dist/                      ← Production build output
    │   ├── index.html
    │   └── assets/
    │       ├── index-*.css
    │       ├── index-*.js
    │       └── logoF-*.png
    │
    └── src/
        ├── main.jsx               ← React DOM entry (renders <App />)
        ├── App.jsx                ← Router setup + PrivateRoute guard
        ├── App.css                ← Global CSS variables, resets, utilities
        ├── index.css              ← Minimal root CSS
        ├── firebase.js            ← Firebase SDK init (auth, db, storage)
        │
        ├── assets/
        │   └── logoF.png          ← Logo used in JSX
        │
        ├── contexts/
        │   ├── AuthContext.jsx    ← Firebase auth state, login/signup/logout
        │   └── DataContext.jsx    ← Fleet data state (demo or Firestore)
        │
        ├── data/
        │   └── fakeData.js        ← Static demo data (6 vehicles, drivers, etc.)
        │
        ├── utils/
        │   ├── liveSimulator.js   ← Real-time vehicle telemetry simulator
        │   └── seedFirestore.js   ← Seeds Firestore with demo data on first load
        │
        ├── components/
        │   ├── LandingNavbar.jsx + .css   ← Public site navbar
        │   ├── DashNavbar.jsx + .css      ← Dashboard top navbar
        │   ├── Sidebar.jsx + .css         ← Dashboard left sidebar
        │   └── ProfileCompletionReminder.jsx + .css  ← Reminder toast
        │
        └── pages/
            ├── Landing.jsx + .css          ← Public homepage
            ├── Login.jsx                   ← Email/password login
            ├── Signup.jsx                  ← Account creation
            ├── AuthPages.css               ← Shared auth page styles
            │
            └── dashboard/
                ├── DashboardLayout.jsx + .css  ← Shell with sidebar + navbar
                ├── Overview.jsx + .css          ← Fleet overview + live telemetry
                ├── VehicleList.jsx + .css       ← Vehicle cards + detail modal
                ├── Analytics.jsx + .css         ← Charts (speed, fuel, scores, pie)
                ├── Reports.jsx + .css           ← Trip table + driver summary
                ├── Maintenance.jsx              ← Maintenance tasks list
                ├── Documents.jsx                ← Document vault view
                ├── UploadDocuments.jsx + .css   ← Document upload form
                ├── ProfileVerification.jsx + .css  ← Profile + ID docs upload
                └── Settings.jsx                 ← User settings stub
```

---

## 4. Technology Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.13 | Backend runtime |
| **FastAPI** | 0.115.5 | REST API framework |
| **Uvicorn** | 0.32.1 | ASGI server |
| **Pydantic v2** | 2.10.3 | Data validation + settings |
| **pydantic-settings** | 2.6.1 | `.env` configuration loading |
| **firebase-admin** | 6.5.0 | Firestore + Firebase Auth (server-side) |
| **paho-mqtt** | 2.1.0 | MQTT client to subscribe to IoT topics |
| **APScheduler** | 3.10.4 | Background scheduler (document expiry checks) |
| **python-dotenv** | 1.0.1 | Load `.env` files |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.0 | UI framework |
| **Vite** | 7.3.1 | Build tool + dev server |
| **React Router DOM** | 7.13.0 | Client-side routing |
| **Firebase SDK** | 12.9.0 | Auth, Firestore, Storage (client-side) |
| **Recharts** | 3.7.0 | Data visualization charts |
| **Lucide React** | 0.575.0 | Icon library |
| **ESLint** | 9.39.1 | Code linting |

### Cloud / Infrastructure

| Service | Usage |
|---|---|
| **Firebase Authentication** | Email/password user accounts |
| **Cloud Firestore** | Primary NoSQL database |
| **Firebase Storage** | File upload storage (documents, photos) |
| **Firebase Hosting** | Frontend deployment |
| **MQTT Broker** | IoT telemetry message transport |

---

## 5. Backend — FastAPI

### 5.1 Entry Point (main.py)

**File:** [backend/main.py](backend/main.py)

This is the application entry point. It:

1. **Initializes FastAPI** with title, version and docs URLs (`/docs`, `/redoc`)
2. **Configures CORS** — allows requests from `localhost:5173` (Vite) and `localhost:3000` via the `allowed_origins_list` from settings
3. **Registers all routers** under the `/api` prefix
4. **Uses a lifespan context manager** to:
   - Start the MQTT client on startup
   - Start APScheduler with a daily document expiry check job
   - Gracefully shut down both on exit
5. **Exposes health check** at `GET /health` and welcome at `GET /`

**How to run:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 5.2 Core Module

#### `core/config.py`

Uses **Pydantic BaseSettings** to load all config from `.env`. Cached with `@lru_cache()`.

Key settings:

| Setting | Default | Description |
|---|---|---|
| `APP_NAME` | TelematicsHub | App name |
| `APP_VERSION` | 1.0.0 | Version string |
| `MQTT_BROKER_HOST` | localhost | MQTT broker address |
| `MQTT_BROKER_PORT` | 1883 | MQTT broker port |
| `MQTT_TOPIC_PREFIX` | telematicshub/vehicles | MQTT topic root |
| `ALLOWED_ORIGINS` | localhost:5173, :3000 | CORS origins |
| `FUEL_ALERT_THRESHOLD` | 25.0 | Fuel % below which alert fires |
| `ENGINE_TEMP_MAX` | 90.0 | Max safe engine temp (°C) |
| `SPEED_LIMIT` | 100.0 | Speed limit (km/h) |
| `DOCUMENT_REMINDER_DAYS` | 30,7,1 | Days before expiry to alert |

#### `core/firebase_admin.py`

Initializes the **Firebase Admin SDK** once (guarded with `if not firebase_admin._apps`). Loads the service account key from `firebase_admin_key.json` in the backend root.

Exports:
- `db` — Firestore client instance
- `fa` — Firebase Admin Auth module

#### `core/dependencies.py`

FastAPI dependency injection functions:

- **`get_current_user(authorization: str = Header(...))`** — Extracts Bearer token from the `Authorization` header, verifies it with `firebase_admin.auth.verify_id_token()`, returns decoded token dict (contains `uid`, `email`, etc.)
- **`get_current_owner(...)`** — Calls `get_current_user` then checks Firestore `users/{uid}` for `role == "owner"`. Returns 403 if not an owner.

These are used as `Depends(...)` in every protected router endpoint.

---

### 5.3 Routers

All routers are prefixed with `/api` from `main.py`.

#### `routers/vehicles.py` — `/api/vehicles`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any user | List vehicles. Owners see all their vehicles; drivers see their assigned vehicle. |
| POST | `/` | Owner only | Create a new vehicle (checks for duplicate registration numbers). |
| GET | `/{vehicle_id}` | Any user | Get single vehicle by Firestore document ID. |
| PUT | `/{vehicle_id}` | Owner only | Update vehicle fields. |
| DELETE | `/{vehicle_id}` | Owner only | Delete vehicle. |

**How it works:** Reads/writes to the `vehicles` Firestore collection. Owners are filtered by `owner_uid == uid`, drivers by `driver_uid == uid`.

---

#### `routers/sensor_data.py` — `/api/sensor-data`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/{vehicle_id}` | Any user | IoT device sends telemetry snapshot (lat, lng, speed, fuel, temp, rpm). Saves to Firestore subcollection and updates vehicle status. |
| GET | `/{vehicle_id}/latest` | Any user | Returns the `last_reading` field from the vehicle document. |
| GET | `/{vehicle_id}/history` | Any user | Returns last N readings from `sensor_data/{vehicle_id}/readings` subcollection, ordered newest first. |

**How it works:** On every POST, it:
1. Saves reading to `sensor_data/{vehicle_id}/readings/{auto_id}`
2. Updates `vehicles/{vehicle_id}` with `last_seen`, `status` (active if speed > 2), `last_reading`
3. Calls `check_and_create_alerts()` from the alert service

---

#### `routers/alerts.py` — `/api/alerts`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any user | List alerts. Optional filters: `vehicle_id`, `resolved`, `severity`. |
| POST | `/` | Owner only | Manually create an alert. |
| PATCH | `/{alert_id}/resolve` | Any user | Mark alert as resolved (sets `resolved=true`, `resolved_at`, `resolved_by`). |
| DELETE | `/{alert_id}` | Owner only | Delete an alert. |

---

#### `routers/documents.py` — `/api/documents`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any user | List documents. Optional filter: `vehicle_id`. |
| POST | `/` | Owner only | Save document metadata (after frontend uploads file to Firebase Storage). |
| GET | `/{doc_id}` | Any user | Get single document. |
| PUT | `/{doc_id}` | Owner only | Update document metadata. |
| DELETE | `/{doc_id}` | Owner only | Delete document record. |

> **Note:** File uploads go directly from the browser to **Firebase Storage**. The backend only stores and retrieves document metadata (type, expiry date, vehicle_id, download URL, etc.) in Firestore.

---

#### `routers/maintenance.py` — `/api/maintenance`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any user | List maintenance tasks. Optional filters: `vehicle_id`, `status`. |
| POST | `/` | Owner only | Create maintenance task (default status: `upcoming`). |
| GET | `/{task_id}` | Any user | Get single maintenance task. |
| PUT | `/{task_id}` | Owner only | Update task fields. |
| PATCH | `/{task_id}/complete` | Owner only | Mark task as completed (sets `status=completed`, `completed_at`, `completed_by`). |
| DELETE | `/{task_id}` | Owner only | Delete task. |

---

#### `routers/trips.py` — `/api/trips`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any user | List trips. Optional filter: `vehicle_id`. |
| POST | `/` | Any user | Start a new trip (records `driver_uid`, `start_time`). |
| GET | `/{trip_id}` | Any user | Get single trip. |
| PATCH | `/{trip_id}/end` | Any user | End a trip (sets `end_time` + any payload fields like distance, fuel_used). |
| DELETE | `/{trip_id}` | Owner only | Delete a trip. |

---

#### `routers/analytics.py` — `/api/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/fleet-summary` | Owner only | Returns KPIs: total/active/offline vehicle counts, unresolved alert count. |
| GET | `/fuel-trend?vehicle_id=X` | Any user | Returns last N fuel readings (timestamp + fuel_pct) from sensor subcollection. |
| GET | `/speed-profile?vehicle_id=X` | Any user | Returns last N speed readings (timestamp + speed) from sensor subcollection. |

---

#### `routers/drivers.py` — `/api/drivers`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Owner only | List all drivers from the `drivers` Firestore collection. |
| GET | `/me` | Any user | Get current user's profile from `users/{uid}`. |
| PUT | `/me` | Any user | Update current user's own profile. |
| GET | `/{driver_id}` | Owner only | Get any driver's profile by UID. |

---

### 5.4 Services

#### `services/alert_service.py`

The **alert engine** that runs after every sensor reading.

**`check_and_create_alerts(vehicle_id, reading)`** — Checks three sensor thresholds:

| Alert Type | Condition | Severity |
|---|---|---|
| `fuel_low` | `fuel < 25%` | `warning`; if `fuel < 10%` → `danger` |
| `engine_temp` | `temp > 90°C` | `danger` |
| `speed_exceeded` | `speed > 100 km/h` | `warning` |

**Deduplication:** Before creating any alert, `_has_open_alert()` queries Firestore to check if an unresolved alert of the same type already exists for that vehicle. If yes, it skips creation.

**`check_document_expiry_alerts()`** — Called daily by APScheduler. Loops through all documents in Firestore and fires alerts for:

- Documents already expired → `danger`
- Documents expiring in exactly 30, 7, or 1 days → `warning` (≤7 days → `danger`)

Handles three document types: Insurance, Pollution Certificate (PUC), Fitness Certificate.

---

### 5.5 MQTT Handler

**File:** [backend/mqtt/mqtt_handler.py](backend/mqtt/mqtt_handler.py)

Subscribes to the MQTT broker and acts as a **bridge between IoT hardware and Firestore**.

**Topic convention:**
```
telematicshub/vehicles/{vehicle_id}/data
```

**ESP32 publishes JSON:**
```json
{
  "lat": 19.076,
  "lng": 72.877,
  "speed": 48.5,
  "fuel": 72,
  "temp": 88,
  "rpm": 2400
}
```

**Flow on message received:**
1. Parse `vehicle_id` from topic path (second-to-last segment)
2. Validate message type is `"data"`
3. Parse JSON payload
4. Write reading to `sensor_data/{vehicle_id}/readings/` (Firestore subcollection)
5. Update `vehicles/{vehicle_id}` with `last_seen`, `status`, `last_reading`
6. Call `check_and_create_alerts()`

**`start_mqtt_client()`** — Called in `main.py` lifespan. Creates a `paho.mqtt.client` instance, sets credentials if configured, connects to broker, starts background loop thread. Returns `None` if MQTT is unavailable (graceful degradation).

---

### 5.6 Database Schema (schema.sql)

**File:** [backend/schema.sql](backend/schema.sql)

This is a **reference/documentation file** for a PostgreSQL schema. The actual project uses **Firestore** (NoSQL), not PostgreSQL. The SQL schema is kept as:
- Documentation of the data model
- A reference for anyone who wants to migrate to PostgreSQL

Tables defined: `users`, `vehicles`, `driver_profiles`, `sensor_data`, `alerts`, `documents`, `maintenance`, `trips`

Two convenience views are also defined:
- `v_fleet_overview` — joins vehicles with latest sensor reading
- `v_expiring_documents` — documents expiring within 30 days

---

### 5.7 Environment Variables

**File:** [backend/.env.example](backend/.env.example)

```env
APP_NAME=TelematicsHub
APP_VERSION=1.0.0
DEBUG=True
ENVIRONMENT=development

MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TOPIC_PREFIX=telematicshub/vehicles

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

FUEL_ALERT_THRESHOLD=25
ENGINE_TEMP_MAX=90
SPEED_LIMIT=100

DOCUMENT_REMINDER_DAYS=30,7,1
```

---

### 5.8 Python Dependencies

**File:** [backend/requirements.txt](backend/requirements.txt)

```
fastapi==0.115.5
uvicorn[standard]==0.32.1
paho-mqtt==2.1.0
python-dotenv==1.0.1
pydantic[email]==2.10.3
pydantic-settings==2.6.1
apscheduler==3.10.4
firebase-admin==6.5.0
```

---

## 6. Frontend — React + Vite

### 6.1 Entry Points

**`index.html`** — The HTML shell. Contains `<div id="root">` where React mounts. Loads `src/main.jsx` via Vite.

**`src/main.jsx`** — Calls `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`. Minimal — just bootstraps React.

---

### 6.2 Firebase Configuration

**File:** [telematicshub/src/firebase.js](telematicshub/src/firebase.js)

Initializes Firebase using environment variables from `.env` (prefixed with `VITE_`):

```js
import { initializeApp } from 'firebase/app';
import { getAuth }        from 'firebase/auth';
import { getFirestore }   from 'firebase/firestore';
import { getStorage }     from 'firebase/storage';
```

Exports three named exports used throughout the app:
- `auth` — Firebase Authentication instance
- `db` — Firestore database instance
- `storage` — Firebase Storage instance

All VITE_ env vars are replaced at build time by Vite — they are never exposed to the backend.

---

### 6.3 React Router (App.jsx)

**File:** [telematicshub/src/App.jsx](telematicshub/src/App.jsx)

Sets up all routes using **React Router DOM v7**:

```
/              → Landing (public)
/login         → Login (public)
/signup        → Signup (public)
/dashboard     → DashboardLayout (protected — requires auth)
  /overview    → Overview
  /vehicles    → VehicleList
  /analytics   → Analytics
  /reports     → Reports
  /maintenance → Maintenance
  /documents   → Documents
  /upload      → UploadDocuments
  /settings    → Settings
  /profile-verification → ProfileVerification
*              → Redirects to /
```

**`PrivateRoute`** component — checks `currentUser` from `AuthContext`. If not authenticated, redirects to `/login`. Shows nothing (`null`) while auth state is loading (prevents flash of redirect).

Provider nesting order:
```jsx
<BrowserRouter>
  <AuthProvider>
    <DataProvider>
      <AppRoutes />
    </DataProvider>
  </AuthProvider>
</BrowserRouter>
```

---

### 6.4 Contexts (State Management)

#### `AuthContext.jsx`

**File:** [telematicshub/src/contexts/AuthContext.jsx](telematicshub/src/contexts/AuthContext.jsx)

Manages all authentication state using **Firebase Auth**.

**State:**
- `currentUser` — Firebase user object (null if not logged in)
- `userRole` — `"owner"` or `"driver"` (read from Firestore `users/{uid}.role`)
- `userProfile` — Full profile document from Firestore
- `authLoading` — True while initial auth state is being determined

**Functions exposed:**
- `login(email, password)` — Signs in, fetches Firestore profile, returns `{user, role}`
- `signup(firstName, lastName, email, phone, password, role)` — Creates Firebase Auth account, writes profile to `users/{uid}` in Firestore
- `logout()` — Signs out via Firebase Auth
- `updateProfile(updates)` — Updates Firestore doc and local state

**`onAuthStateChanged`** listener runs on mount — re-fetches profile from Firestore on every auth state change (login, page refresh, etc.).

---

#### `DataContext.jsx`

**File:** [telematicshub/src/contexts/DataContext.jsx](telematicshub/src/contexts/DataContext.jsx)

Manages all fleet data. Operates in two modes controlled by `VITE_DEMO_MODE` environment variable.

**State provided:**
- `vehicles` — Array of vehicle objects
- `alerts` — Array of alert objects
- `drivers` — Array of driver objects
- `maintenance` — Array of maintenance task objects
- `documents` — Array of document metadata objects
- `recentTrips` — Array of trip records
- `fuelTrend` — 7-day fuel level data for charts
- `tripData` — Monthly trip counts for bar chart
- `speedData` — Speed time-series for line chart
- `liveTs` — Date object updated every 3s in demo mode (drives "LIVE" badge)
- `dataLoading` — Boolean loading state

**Demo Mode (`VITE_DEMO_MODE=true`):**
- Uses `fakeData.js` as initial state — no Firestore reads
- Starts `liveSimulator.js` to tick vehicle values every 3 seconds

**Real Mode (`VITE_DEMO_MODE=false`):**
- Checks if `vehicles` collection is empty; if so, calls `seedFirestore()` to populate initial data
- Loads all collections in parallel with `Promise.all()`
- Does NOT run the live simulator

---

### 6.5 Pages

#### `pages/Landing.jsx`

**File:** [telematicshub/src/pages/Landing.jsx](telematicshub/src/pages/Landing.jsx)

The public marketing homepage. Sections:

1. **Hero section** — Headline, description, CTAs ("Get Started Free", "View Live Demo"), animated metrics (6+ vehicles, 99.8% uptime, <5s latency, 24/7 monitoring), dashboard mockup panel showing live vehicle statuses
2. **Trust bar** — "Built on: Firebase, MQTT/IoT, React, Python, ESP32/Arduino"
3. **Features grid** — 6 feature cards (GPS tracking, Sensor fusion, Alert engine, Document vault, Fleet analytics, Maintenance scheduler)
4. **How It Works** — 4-step pipeline (Sensor Layer → MQTT Transmission → Cloud Processing → Dashboard View)
5. **Telemetry Preview** — Terminal-style display showing MQTT JSON payloads
6. **CTA section** — "Ready to Monitor Your Fleet?" with signup link
7. **Footer** — Brand, product links, features links, copyright

---

#### `pages/Login.jsx` + `pages/Signup.jsx`

Email/password authentication forms that call `login()` / `signup()` from `AuthContext`. After success, redirect to `/dashboard/overview`.

**Signup collects:** First name, Last name, Email, Phone, Password, Role (Owner / Driver)

---

#### `pages/dashboard/DashboardLayout.jsx`

**File:** [telematicshub/src/pages/dashboard/DashboardLayout.jsx](telematicshub/src/pages/dashboard/DashboardLayout.jsx)

The persistent shell for all dashboard pages. Contains:
- `DashNavbar` — top navigation bar
- `Sidebar` — left navigation menu
- `<Outlet context={{ view }}>` — renders the active dashboard page, passing `view` ("owner" or "driver") as outlet context
- `ProfileCompletionReminder` — floating reminder component

`view` is derived from `userRole` from `AuthContext`.

---

#### `pages/dashboard/Overview.jsx`

**File:** [telematicshub/src/pages/dashboard/Overview.jsx](telematicshub/src/pages/dashboard/Overview.jsx)

The main fleet dashboard. Displays:

1. **Live Vehicle Telemetry Ticker** — A card per vehicle showing reg number, status badge, speed/fuel/temp, odometer. Active vehicles show a green gradient stripe at the top.
2. **Stat Cards** (4) — Total vehicles, Active now, Active alerts, Offline/Service count
3. **Charts row:**
   - **Fuel Levels Area Chart** — Last 7 days, 3 vehicles (V001, V003, V005), using Recharts `AreaChart`
   - **Monthly Trips Bar Chart** — Using Recharts `BarChart`
4. **Vehicle Status mini-list** — Compact list with fuel bar per vehicle
5. **Active Alerts list** — Colored by severity (danger/warning/info)
6. **Recent Trips table** — Vehicle, driver, from/to, distance, duration, date, fuel used

**`LiveBadge` component** — Shows "LIVE · updated Xs ago" badge. Uses a `setInterval` to count seconds since last `liveTs` update.

---

#### `pages/dashboard/VehicleList.jsx`

**File:** [telematicshub/src/pages/dashboard/VehicleList.jsx](telematicshub/src/pages/dashboard/VehicleList.jsx)

Fleet vehicle management page. Features:

- **Filter tabs** — All, Active, Idle, Maintenance, Offline (with counts)
- **Search box** — Filters by registration, model, or driver name
- **Vehicle cards grid** — Each card shows reg, model/year, assigned driver avatar + name, fuel bar, temp bar, speed indicator, odometer
- **Clicking a card** opens a **VehicleDetailModal** with full sensor data, GPS coordinates, and (for owners) document expiry dates
- **"+ Add Vehicle" button** (owner only) opens an add vehicle modal with form fields

---

#### `pages/dashboard/Analytics.jsx`

**File:** [telematicshub/src/pages/dashboard/Analytics.jsx](telematicshub/src/pages/dashboard/Analytics.jsx)

Fleet analytics with multiple Recharts visualizations:

1. **KPI row** — Total distance, Avg driving score, Fuel efficiency, Idle time
2. **Speed Profile Area Chart** — V001 today's speed over time
3. **Monthly Trips & Distance Dual-Axis Bar Chart** — trips (left axis) + km (right axis)
4. **Fleet Status Donut/Pie Chart** — Active/Idle/Maintenance/Offline distribution
5. **Driver Performance Scores Horizontal Bar Chart** — Color-coded by score range
6. **Alert Frequency by Type** — Custom progress bars for fuel low, insurance, overheating, pollution

---

#### `pages/dashboard/Reports.jsx`

**File:** [telematicshub/src/pages/dashboard/Reports.jsx](telematicshub/src/pages/dashboard/Reports.jsx)

Trip history and driver summary page:

- **Summary cards** — Total trips, total distance, fuel consumed, avg trip distance
- **Filter controls** — Vehicle selector, from/to date pickers
- **Trip Log table** — Full trip details (vehicle, driver, from/to, distance, duration, avg speed, fuel, date)
- **Driver Summary table** — Per-driver trips, driving score bar, status badge, vehicle, license expiry

---

#### `pages/dashboard/Maintenance.jsx`

**File:** [telematicshub/src/pages/dashboard/Maintenance.jsx](telematicshub/src/pages/dashboard/Maintenance.jsx)

Maintenance tracking page:

- **Summary stat cards** — Overdue / Upcoming / Completed counts (clickable to filter)
- **Filter tabs** — All, Overdue, Upcoming, Completed
- **Task list** — Each item shows type, status badge, vehicle, notes, due date, estimated cost
- **"Mark Done" and "Edit" buttons** for owners
- **"+ Add Task" modal** — Vehicle select, maintenance type, due date, estimated cost, notes

---

#### `pages/dashboard/Documents.jsx`

**File:** [telematicshub/src/pages/dashboard/Documents.jsx](telematicshub/src/pages/dashboard/Documents.jsx)

Document vault page:

- **Summary stat cards** — Valid / Expiring Soon / Expired counts
- **Filter tabs** + vehicle selector dropdown
- **Document cards grid** — Each card has left-border color by status, shows type, vehicle, issuer, issue/expiry dates
- **View, Download, Renew buttons** (owner only)
- Renew button links to `/dashboard/upload`

---

#### `pages/dashboard/UploadDocuments.jsx`

**File:** [telematicshub/src/pages/dashboard/UploadDocuments.jsx](telematicshub/src/pages/dashboard/UploadDocuments.jsx)

The document upload page (Owner only — shows "Owner Access Only" for drivers).

**Upload Flow:**
1. Owner fills form: vehicle, document type (Insurance, PUC, RC, Fitness Certificate, etc.), issuer, issue date, expiry date
2. Owner drags-and-drops or picks files (PDF, JPG, PNG — max 10MB)
3. On submit:
   - Each file is uploaded to **Firebase Storage** at path `documents/{vehicle_id}/{docType}/{timestamp}_{filename}`
   - `getDownloadURL()` retrieves the public URL
   - Document metadata + file URLs are saved to **Firestore** `documents` collection via `addDoc()`
4. Session upload history is shown in the sidebar panel

---

#### `pages/dashboard/ProfileVerification.jsx`

**File:** [telematicshub/src/pages/dashboard/ProfileVerification.jsx](telematicshub/src/pages/dashboard/ProfileVerification.jsx)

Profile completion and identity verification page. Contains 4 sections:

1. **Progress bar** — 0–100% based on: first name, last name, phone, govt ID, address proof (5 fields)
2. **Status banner** — Green "Verification Complete" or yellow "Action Required" listing missing items
3. **Personal Information form** — First/last name, email (disabled), phone. Saves to Firestore via `updateProfile()`
4. **Profile Photo** — Upload image to Firebase Storage at `profile_photos/{uid}`, saves URL to Firestore profile
5. **Identity Verification Documents** — Upload Govt ID and Address Proof to Firebase Storage at `verification_docs/{uid}/{docKey}`, saves metadata (url, filename, uploadedAt, status: "pending_review") to `users/{uid}.verificationDocs`
6. **Verification Status checklist** — Visual list showing complete/incomplete for each required field

---

#### `pages/dashboard/Settings.jsx`

Stub settings page (placeholder — not fully implemented in current version).

---

### 6.6 Components

#### `components/LandingNavbar.jsx`

Top navigation for the public landing page. Shows logo, navigation links (if any), and login/signup buttons.

#### `components/DashNavbar.jsx`

Dashboard top navigation bar. Contains:
- Hamburger menu button to toggle sidebar
- App logo and title
- User avatar and dropdown (profile, logout)
- Notification bell (UI element)

#### `components/Sidebar.jsx`

**File:** [telematicshub/src/components/Sidebar.jsx](telematicshub/src/components/Sidebar.jsx)

Left navigation sidebar with role-based menus:

**Owner menu:**
- Main: Overview, Vehicle List, Analytics, Reports
- Fleet: Maintenance, Documents, Upload Documents
- Account: Profile Verification, Settings

**Driver menu:**
- Driver: Overview, My Vehicle, Trip History, Documents, Profile Verification, Settings

Uses `NavLink` from React Router for active highlighting. Shows user initials/name and role at the bottom. Has a mobile overlay when open.

All icons are inline SVG components defined at the bottom of the file (no external icon library for sidebar icons).

#### `components/ProfileCompletionReminder.jsx`

A floating toast/banner shown if the user's profile is incomplete. Links to `/dashboard/profile-verification`.

---

### 6.7 Utilities

#### `utils/liveSimulator.js`

**File:** [telematicshub/src/utils/liveSimulator.js](telematicshub/src/utils/liveSimulator.js)

Generates realistic, continuously-changing vehicle telemetry for the demo mode.

**`tickVehicle(v)`** — Updates one vehicle per tick:
- **Speed** — Drifts toward a random target (35–75 km/h for active vehicles) with jitter
- **Fuel** — Drains at `0.03 + (speed/80) * 0.05` per tick (faster at higher speeds)
- **Engine temp** — Rises with speed, stabilizes around 82–90°C
- **GPS** — Small lat/lng step proportional to speed
- **Odometer** — Increments `speed / 1200` km per 3-second tick

**`deriveAlerts(vehicles, existingAlerts)`** — Generates live alerts from current vehicle states:
- `fuel < 25%` → Low Fuel (danger if < 15%)
- `temp > 92°C` and active → Engine Overheating (danger if > 100°C)
- `speed > 90 km/h` → High Speed warning
Keeps existing static alerts (insurance, pollution), replaces sensor-based ones.

**`tickSpeedData(speedData, activeVehicle)`** — Slides a 14-point speed chart window forward with the current timestamp and speed.

**`startLiveSimulation(setVehicles, setAlerts, setSpeedData, setLiveTs, intervalMs=3000)`** — Starts a `setInterval` that ticks all vehicles every 3 seconds and updates React state. Returns a cleanup function that clears the interval.

---

#### `utils/seedFirestore.js`

Seeds the Firestore database with demo data on first load (when `vehicles` collection is empty). Writes the same data as `fakeData.js` to Firestore collections.

---

### 6.8 Demo Data (fakeData.js)

**File:** [telematicshub/src/data/fakeData.js](telematicshub/src/data/fakeData.js)

Static Indian fleet demo data including:

**6 Vehicles** — Real Indian models:
- V001: Tata Nexon (Mumbai, MH plate) — active, 72% fuel, 88°C, 48 km/h
- V002: Mahindra Scorpio (Delhi, DL plate) — idle, 35% fuel
- V003: Hyundai i20 (Bangalore, KA plate) — active, 88% fuel
- V004: Maruti Swift (Ahmedabad, GJ plate) — maintenance, 20% fuel, 95°C
- V005: Toyota Innova (Chennai, TN plate) — active, 55% fuel
- V006: Force Traveller (Jaipur, RJ plate) — offline, expired insurance

**6 Drivers** — With Indian names, phone numbers, license numbers, driving scores (74–95)

**Alerts** — Insurance expiry, engine overheating, fuel low, etc.

**Maintenance tasks** — Oil change, brake inspection, tire rotation

**Documents** — Insurance, PUC, fitness certificates with various statuses

**Chart data** — 7-day fuel trend, monthly trip data, speed time-series

---

### 6.9 npm Dependencies

**File:** [telematicshub/package.json](telematicshub/package.json)

```json
{
  "dependencies": {
    "firebase": "^12.9.0",
    "lucide-react": "^0.575.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.0",
    "recharts": "^3.7.0"
  }
}
```

---

## 7. Firebase Services Used

| Service | How It's Used |
|---|---|
| **Firebase Authentication** | Email/password signup and login. `onAuthStateChanged` listener tracks session state. Tokens (ID tokens) are sent in `Authorization: Bearer` headers to the FastAPI backend. |
| **Cloud Firestore** | Primary database. Stores vehicles, alerts, drivers, documents, maintenance, trips, sensor data. Both the React frontend (client SDK) and Python backend (Admin SDK) read/write Firestore. |
| **Firebase Storage** | File storage for vehicle documents (insurance PDFs, etc.), profile photos, and identity verification documents. Files are uploaded directly from the browser using the client SDK. |
| **Firebase Hosting** | The built React app (`dist/`) is deployed to Firebase Hosting. Config in `firebase.json` and `.firebaserc`. |

---

## 8. Firestore Collections

| Collection | Document Fields | Description |
|---|---|---|
| `users` | `firstName, lastName, name, email, phone, role, createdAt, photoURL, verificationDocs` | User profiles (owners and drivers) |
| `vehicles` | `owner_uid, driver_uid, registration_number, model, make, year, vehicle_type, status, last_seen, last_reading, created_at` | Fleet vehicles |
| `sensor_data/{vehicleId}/readings` | `vehicle_id, timestamp, lat, lng, speed, fuel, temp, rpm` | IoT telemetry subcollection per vehicle |
| `alerts` | `vehicle_id, alert_type, severity, message, resolved, resolved_at, resolved_by, created_at` | Auto and manual alerts |
| `documents` | `vehicle_id, document_type, issuer, issue_date, expiry_date, files, uploaded_by, uploaded_at` | Vehicle compliance documents metadata |
| `maintenance` | `vehicle_id, task_type, description, status, due_date, estimated_cost, created_by, created_at, completed_at` | Maintenance task records |
| `trips` | `vehicle_id, driver_uid, origin, destination, start_time, end_time, distance_km, fuel_used` | Trip log |
| `drivers` | Driver-specific records | Separate drivers collection |

---

## 9. Authentication & Authorization

### Frontend

1. User logs in via `Login.jsx` → `login()` in `AuthContext`
2. Firebase Auth returns a user object and ID token
3. `AuthContext` reads `users/{uid}` from Firestore to get the `role` field
4. `userRole` is set globally in context (`"owner"` or `"driver"`)
5. `PrivateRoute` in `App.jsx` redirects unauthenticated users to `/login`
6. `DashboardLayout` passes `view = userRole` to all child pages via `Outlet context`
7. Each page reads `const { view } = useOutletContext()` and conditionally renders owner-only UI

### Backend

1. Frontend sends `Authorization: Bearer <Firebase ID Token>` header with every API request
2. `get_current_user()` dependency extracts and verifies the token using `firebase_admin.auth.verify_id_token()`
3. Returns decoded token dict (contains `uid`, `email`, etc.)
4. `get_current_owner()` additionally checks `users/{uid}.role == "owner"` in Firestore; returns 403 if not

**Token flow:**
```
Frontend → getIdToken() from Firebase → sends in Authorization header
Backend → verify_id_token() → extracts uid → checks role in Firestore
```

---

## 10. API Endpoints Reference

Base URL: `http://localhost:8000`

```
GET    /health                              Health check
GET    /                                   Welcome message
GET    /docs                               Swagger UI
GET    /redoc                              ReDoc UI

# Vehicles
GET    /api/vehicles/                      List vehicles (role-filtered)
POST   /api/vehicles/                      Create vehicle (owner)
GET    /api/vehicles/{id}                  Get vehicle
PUT    /api/vehicles/{id}                  Update vehicle (owner)
DELETE /api/vehicles/{id}                  Delete vehicle (owner)

# Sensor Data
POST   /api/sensor-data/{vehicle_id}       Ingest telemetry snapshot
GET    /api/sensor-data/{vehicle_id}/latest   Latest reading
GET    /api/sensor-data/{vehicle_id}/history  History (newest first)

# Alerts
GET    /api/alerts/                        List alerts (filterable)
POST   /api/alerts/                        Create alert (owner)
PATCH  /api/alerts/{id}/resolve            Resolve alert
DELETE /api/alerts/{id}                    Delete alert (owner)

# Documents
GET    /api/documents/                     List documents
POST   /api/documents/                     Save document metadata (owner)
GET    /api/documents/{id}                 Get document
PUT    /api/documents/{id}                 Update document (owner)
DELETE /api/documents/{id}                 Delete document (owner)

# Maintenance
GET    /api/maintenance/                   List tasks
POST   /api/maintenance/                   Create task (owner)
GET    /api/maintenance/{id}               Get task
PUT    /api/maintenance/{id}               Update task (owner)
PATCH  /api/maintenance/{id}/complete      Mark complete (owner)
DELETE /api/maintenance/{id}               Delete task (owner)

# Trips
GET    /api/trips/                         List trips
POST   /api/trips/                         Start trip
GET    /api/trips/{id}                     Get trip
PATCH  /api/trips/{id}/end                 End trip
DELETE /api/trips/{id}                     Delete trip (owner)

# Analytics
GET    /api/analytics/fleet-summary        Fleet KPIs (owner)
GET    /api/analytics/fuel-trend           Fuel readings for vehicle
GET    /api/analytics/speed-profile        Speed readings for vehicle

# Drivers
GET    /api/drivers/                       List all drivers (owner)
GET    /api/drivers/me                     Current user profile
PUT    /api/drivers/me                     Update own profile
GET    /api/drivers/{id}                   Get driver profile (owner)
```

---

## 11. Alert Engine Logic

The alert engine runs in two places:

### 1. Real-time (per sensor reading)

Every time a sensor reading is ingested (via HTTP POST or MQTT):

```
reading → check_and_create_alerts(vehicle_id, reading)
    ├── fuel < threshold?
    │     └── _has_open_alert(vehicle_id, "fuel_low")? → skip / create
    ├── temp > ENGINE_TEMP_MAX?
    │     └── _has_open_alert(vehicle_id, "engine_temp")? → skip / create
    └── speed > SPEED_LIMIT?
          └── _has_open_alert(vehicle_id, "speed_exceeded")? → skip / create
```

### 2. Scheduled (daily)

APScheduler runs `check_document_expiry_alerts()` every 24 hours:

```
All documents in Firestore
    → filter by document_type in [Insurance, Pollution Certificate, Fitness Certificate]
    → calculate days_left = expiry_date - today
    → days_left < 0 → danger alert (already expired)
    → days_left in [30, 7, 1] → warning/danger alert
    → deduplication: _has_open_alert() before creating
```

### Alert Severity Levels

| Severity | Color | Meaning |
|---|---|---|
| `danger` | Red `#e74c3c` | Critical — immediate action required |
| `warning` | Orange `#f39c12` | Attention needed soon |
| `info` | Teal `#2a8e9e` | Informational |

---

## 12. MQTT / IoT Data Flow

```
ESP32 hardware (on vehicle)
    ↓  publishes every ~5 seconds
MQTT Broker (localhost:1883 in dev)
    ↓  topic: telematicshub/vehicles/{vehicle_id}/data
Python MQTT Handler (paho.mqtt.client)
    ↓  subscribes to: telematicshub/vehicles/+/data
    ├── parse vehicle_id from topic
    ├── decode JSON payload
    ├── save reading to Firestore sensor_data/{vehicle_id}/readings
    ├── update vehicles/{vehicle_id} status fields
    └── trigger alert engine
```

The MQTT client runs in a **background thread** (via `client.loop_start()`). It's started in the `lifespan` context manager and stopped gracefully on shutdown.

If the MQTT broker is not available (connection failure), the backend logs a warning and continues running — MQTT is optional for the REST API to work.

---

## 13. Live Demo Mode vs Real Mode

Controlled by `VITE_DEMO_MODE` in the frontend `.env`:

| | Demo Mode (`true`) | Real Mode (`false`) |
|---|---|---|
| Data source | `fakeData.js` (static JS) | Firestore collections |
| Live updates | `liveSimulator.js` via `setInterval` every 3s | Static (no real-time push) |
| "LIVE" badge | Shows with seconds counter | Hidden |
| Firestore reads | None | `Promise.all()` fetches all collections |
| Seed | Never called | Called if `vehicles` collection is empty |
| Use case | Demo/showcase | Production |

---

## 14. User Roles

### Owner (`role: "owner"`)

- Full access to all vehicles they own
- Can create/update/delete vehicles, documents, maintenance tasks, alerts
- Can view all drivers under their fleet
- Sees full analytics and reports
- Can upload documents

### Driver (`role: "driver"`)

- Sees only their assigned vehicle
- Can view documents and trips
- Can update their own profile
- Cannot create vehicles, documents, or maintenance tasks
- Sidebar shows a simplified driver menu

Role is stored in Firestore `users/{uid}.role` and checked:
- **Frontend** — in `AuthContext` → `userRole` → passed as `view` to all pages
- **Backend** — in `get_current_owner()` dependency → returns 403 for non-owners

---

## 15. How to Run the Project

### Method 1: Run Both Together (root package.json)

```bash
# From d:\final_project
npm install
npm start
# Starts backend (uvicorn) and frontend (vite) concurrently
```

### Method 2: Run Separately

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate         # Windows
pip install -r requirements.txt
# Place firebase_admin_key.json in backend/
# Copy .env.example to .env and fill in values
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd telematicshub
npm install
# Copy .env.example to .env and fill in Firebase config
npm run dev
# Starts at http://localhost:5173
```

### Prerequisites

- Node.js + npm
- Python 3.11+
- Firebase project with Auth, Firestore, and Storage enabled
- `firebase_admin_key.json` service account key (from Firebase Console)
- (Optional) MQTT broker (e.g., Mosquitto) for IoT integration

---

## 16. Design & UI Choices

### Color Scheme (Dark Industrial)

Defined as CSS variables in `App.css`:

| Variable | Color | Usage |
|---|---|---|
| `--primary` | `#2a8e9e` | Brand color (teal) |
| `--primary-light` | `#3ab5c8` | Lighter teal for accents |
| `--dark-bg` | `#0d1520` | Page background |
| `--card-bg` | `#111e2e` | Card/panel background |
| `--card-border` | `rgba(42,142,158,0.12)` | Subtle teal border |
| `--success` | `#27ae60` | Green for active/ok |
| `--warning` | `#f39c12` | Orange for warnings |
| `--danger` | `#e74c3c` | Red for critical alerts |

### Design Patterns

- **Cards** — Dark background with subtle teal border, `border-radius: 12-16px`
- **Badges** — Small pill labels: `badge-success` (green), `badge-warning` (orange), `badge-danger` (red), `badge-info` (teal)
- **Tables** — Dark rows with hover highlight, scrollable with `overflow-x: auto`
- **Charts** — Recharts with matching dark theme colors, custom `CustomTooltip` component
- **Animations** — `animate-fade-in` CSS class with `@keyframes fadeIn` on all page entries
- **Modals** — Dark overlay with `modal-overlay`, centered `modal-box` with header, body, footer
- **Forms** — Consistent `form-group` pattern with dark inputs and teal focus rings

---

## 17. Data Flow — End to End

### Scenario: IoT device sends telemetry

```
1. ESP32 publishes JSON → MQTT broker
2. Python MQTT handler receives message
3. Saves reading to Firestore: sensor_data/V001/readings/{auto_id}
4. Updates vehicles/V001: status=active, last_reading={...}
5. alert_service checks: fuel=18% → fires fuel_low warning
6. Alert written to Firestore: alerts/{auto_id}
7. [Demo mode] Frontend liveSimulator.js runs every 3s, calls tickVehicle()
8. React DataContext updates state → all subscribed components re-render
9. Overview page shows updated fuel bar and new alert
```

### Scenario: Owner uploads insurance document

```
1. Owner fills form on UploadDocuments page (vehicle, type, dates)
2. Selects PDF file(s) via drag-drop or browse
3. On submit:
   a. uploadBytes() → Firebase Storage: documents/V001/Insurance/1234567_policy.pdf
   b. getDownloadURL() → gets public URL
   c. addDoc() → Firestore documents collection with metadata + URL
4. Upload history panel updates in UI
5. Documents page now shows new document card
6. Next daily APScheduler run will check this document's expiry date
```

### Scenario: Owner views analytics

```
1. Analytics page renders
2. useData() hook reads from DataContext
3. In demo mode: data comes from fakeData.js + liveSimulator updates
4. In real mode: DataContext fetched from Firestore on page load
5. Recharts renders charts with the data
6. Driver scores are mapped from drivers array: driverScoreData
```

---

*Documentation generated: 2026-03-20*
*Project version: 2.0.0*
*Stack: React 19 + Vite 7 + FastAPI 0.115 + Firebase + MQTT*
