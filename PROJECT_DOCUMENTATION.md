# TelematicsHub — Full Project Documentation

**IoT-Based Smart Vehicle Telematics System**
Vehicle: Hyundai Venue | Account: mritunjay@gmail.com

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Hardware Setup](#3-hardware-setup)
4. [Wiring Diagrams](#4-wiring-diagrams)
5. [Arduino Programs](#5-arduino-programs)
6. [Backend (FastAPI)](#6-backend-fastapi)
7. [Frontend Dashboard (React)](#7-frontend-dashboard-react)
8. [Firebase Setup](#8-firebase-setup)
9. [How to Run Everything](#9-how-to-run-everything)
10. [Data Flow](#10-data-flow)
11. [Dashboard Features](#11-dashboard-features)
12. [API Reference](#12-api-reference)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Project Overview

TelematicsHub is a real-time vehicle telematics system built for a Hyundai Venue. It reads OBD-II engine data, alcohol levels, and GPS coordinates from the vehicle and displays them live on a web dashboard.

**What the system does:**
- Reads 5 OBD-II parameters from the car ECU via Bluetooth (ELM327)
- Reads alcohol level from an MQ-3 sensor
- Reads GPS position (lat, lng, altitude, speed, satellites) from a Neo-6M GPS module
- Sends all data to a FastAPI backend every 5 seconds via HTTP POST
- Backend stores data in Firebase Firestore and triggers automatic alerts
- React dashboard shows live data with real-time Firestore push updates

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HARDWARE LAYER                          │
│                                                             │
│  ┌──────────────────────┐    UART     ┌──────────────────┐  │
│  │  ESP32 #2 (Slave)    │ ──────────► │  ESP32 #1        │  │
│  │  - MQ-3 Alcohol      │  TX17→RX16  │  (Master)        │  │
│  │  - GPS Neo-6M        │             │  - OBD via BT    │  │
│  └──────────────────────┘             │  - WiFi client   │  │
│                                       └────────┬─────────┘  │
└────────────────────────────────────────────────│────────────┘
                                                 │ HTTP POST
                                                 │ every 5s
                              ┌──────────────────▼───────────┐
                              │  Redmi Note 8 Pro Hotspot    │
                              │  WiFi: "Redmi Note 8 Pro"    │
                              │  Pass: "oooooooo"            │
                              └──────────────────┬───────────┘
                                                 │
                              ┌──────────────────▼───────────┐
                              │  FastAPI Backend (port 8000) │
                              │  Running on laptop           │
                              │  POST /api/iot/data/mritunjay│
                              │  - Validates API key         │
                              │  - Checks alert thresholds   │
                              └──────────────────┬───────────┘
                                                 │
                              ┌──────────────────▼───────────┐
                              │  Firebase Firestore           │
                              │  Project: treqzen-iot        │
                              │  - vehicles/mritunjay        │
                              │  - sensor_data/readings      │
                              │  - alerts                    │
                              └──────────────────┬───────────┘
                                                 │ onSnapshot
                              ┌──────────────────▼───────────┐
                              │  React Dashboard (port 5173) │
                              │  - Live OBD Feed panel       │
                              │  - Alcohol + GPS display     │
                              │  - Automatic alert system    │
                              └──────────────────────────────┘
```

---

## 3. Hardware Setup

### Components Required

| # | Component | Purpose |
|---|-----------|---------|
| 1 | ESP32 Dev Module ×2 | Master: OBD + WiFi; Slave: sensors |
| 2 | ELM327 Bluetooth OBD Adapter | Reads car ECU via OBD-II port |
| 3 | MQ-3 Alcohol Sensor | Detects alcohol in cabin air |
| 4 | GPS Module Neo-6M | GPS coordinates, speed, altitude |
| 5 | Redmi Note 8 Pro | WiFi hotspot for ESP32 connectivity |
| 6 | USB cables ×2 | Power + programming ESP32s |
| 7 | Jumper wires | Connections between components |

### OBD Adapter Details
- **Bluetooth MAC:** `00:10:CC:4F:36:03`
- **PIN:** `0000`
- **Protocol:** ELM327 AT commands over Bluetooth SPP
- **OBD Port Location:** Under dashboard, driver side

---

## 4. Wiring Diagrams

### ESP32 #1 (Master)

```
ESP32 Master          Connected To
─────────────         ────────────────────────
GPIO 2          →     Built-in LED (status blinks)
GPIO 16 (RX2)   ←     Slave ESP32 GPIO 17 (TX)    [cross-wire]
GPIO 17 (TX2)   →     Slave ESP32 GPIO 16 (RX)    [cross-wire]
GND             ←→    Slave ESP32 GND              [common ground]
WiFi (built-in)       Connects to Redmi hotspot
Bluetooth (BT)        Connects to ELM327 OBD adapter
```

### ESP32 #2 (Slave)

```
ESP32 Slave           Connected To
─────────────         ────────────────────────
GPIO 34 (ADC)   ←     MQ-3 AOUT
GPIO 4  (RX1)   ←     GPS Neo-6M TX
GPIO 2  (TX1)   →     GPS Neo-6M RX (optional)
GPIO 16 (RX2)   ←     Master ESP32 GPIO 17 (TX)   [cross-wire]
GPIO 17 (TX2)   →     Master ESP32 GPIO 16 (RX)   [cross-wire]
3.3V            →     MQ-3 VCC + GPS VCC
GND             ←→    MQ-3 GND + GPS GND + Master GND
```

### MQ-3 Sensor

```
MQ-3 Pin    ESP32 Slave
VCC    →    3.3V (or 5V for better sensitivity)
GND    →    GND
AOUT   →    GPIO 34
DOUT        Not used
```

> Allow MQ-3 to warm up 2–3 minutes before readings are accurate.

### GPS Neo-6M

```
GPS Pin    ESP32 Slave
VCC   →    3.3V
GND   →    GND
TX    →    GPIO 4
RX    →    GPIO 2 (optional)
```

> GPS needs clear outdoor sky view. First fix: 1–3 minutes.

---

## 5. Arduino Programs

### File Locations

```
hardware/
├── ESP32_Master_Unit/
│   └── ESP32_Master_Unit.ino      ← Upload to ESP32 #1
├── ESP32_Slave_Sensor/
│   └── ESP32_Slave_Sensor.ino     ← Upload to ESP32 #2
├── ESP32_OBD2_WiFi_Sender/        (older — OBD only, no alcohol/GPS)
├── ESP32_OBD2_Dashboard/          (standalone local dashboard)
└── ESP32_OBD2_Reader/             (testing only)
```

### Arduino IDE Settings (both boards)

```
Board              : ESP32 Dev Module
Upload Speed       : 921600
Partition Scheme   : Huge APP (3MB No OTA/1MB SPIFFS)  ← REQUIRED
Serial Monitor     : 115200 baud
```

### Libraries to Install (Tools → Manage Libraries)

| Library | Used By |
|---------|---------|
| ArduinoJson (≥7.x) | Master + Slave |
| TinyGPS++ (≥1.0.3) | Slave only |
| BluetoothSerial | Master (built-in with ESP32) |
| WiFi | Master (built-in) |
| HTTPClient | Master (built-in) |

### Master Config Values

Edit these in `ESP32_Master_Unit.ino` before uploading:

```cpp
const char* SSID      = "Redmi Note 8 Pro";
const char* PASS      = "oooooooo";
const char* SERVER_IP = "192.168.72.54";   // your laptop IP on hotspot
                                           // run ipconfig → Wireless IPv4
```

### LED Blink Reference (Master)

| Pattern | Meaning |
|---------|---------|
| Fast blink (continuous) | Connecting to WiFi |
| 2 quick blinks | WiFi connected |
| 3 quick blinks | ELM327 Bluetooth connected |
| 1 long blink | Data sent to backend (success) |
| 5 rapid blinks | Backend POST failed |

### OBD-II Parameters

| PID | Parameter | Formula |
|-----|-----------|---------|
| 010C | Engine RPM | ((A×256)+B) / 4 |
| 010D | Vehicle Speed | A km/h |
| 012F | Fuel Level | (A×100) / 255 % |
| 0104 | Engine Load | (A×100) / 255 % |
| 0105 | Coolant Temp | A − 40 °C |

### Alcohol Level Classification

| Level | ADC Range | Meaning | Alert |
|-------|-----------|---------|-------|
| 0 | raw < 200 | Sober | None |
| 1 | 200–599 | Trace | None |
| 2 | 600–899 | Moderate | Warning |
| 3 | ≥ 900 | High | Danger |

---

## 6. Backend (FastAPI)

### Directory Structure

```
backend/
├── main.py                  App entry point + lifespan
├── .env                     Firebase Admin credentials
├── requirements.txt
├── core/
│   ├── config.py            Alert thresholds + settings
│   └── firebase_admin.py    Firebase Admin SDK init
├── routers/
│   ├── iot.py               ESP32 data ingestion endpoint
│   ├── vehicles.py
│   ├── alerts.py
│   ├── sensor_data.py
│   ├── analytics.py
│   ├── documents.py
│   ├── maintenance.py
│   ├── trips.py
│   └── drivers.py
└── services/
    └── alert_service.py     Threshold checks + alert creation
```

### Start Command

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### IoT Endpoint

```
POST /api/iot/data/{vehicle_id}?key=OBD2_ESP32_KEY
Content-Type: application/json
```

Full JSON payload:
```json
{
  "rpm": 820,
  "speed": 0,
  "fuel": 65,
  "temp": 88,
  "engine_load": 12,
  "throttle": 0,
  "intake_air": 32,
  "battery": 12.6,
  "lat": 28.6139,
  "lng": 77.2090,
  "alcohol_level": 0,
  "mq3_voltage": 0.12,
  "gps_valid": true,
  "altitude": 216.0,
  "gps_speed": 0.0,
  "satellites": 8
}
```

### Alert Thresholds

| Condition | Threshold | Severity |
|-----------|-----------|---------|
| Fuel low | < 20% | Warning |
| Fuel critical | < 10% | Danger |
| Engine overheating | > 100°C | Danger |
| Speed exceeded | > 120 km/h | Warning |
| Alcohol moderate | Level 2 | Warning |
| Alcohol high | Level 3 | Danger |

---

## 7. Frontend Dashboard (React)

### Directory Structure

```
telematicshub/
├── .env                     VITE_DEMO_MODE + Firebase config
├── src/
│   ├── firebase.js          Firebase Web SDK initialization
│   ├── contexts/
│   │   └── DataContext.jsx  Global state, Firestore loader, vehicle filter
│   ├── data/
│   │   └── fakeData.js      Single placeholder vehicle (Hyundai Venue)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── dashboard/
│   │       ├── Overview.jsx     Live OBD Feed + fleet stats
│   │       ├── VehicleList.jsx  Vehicle cards + detail modal
│   │       ├── Analytics.jsx
│   │       ├── Maintenance.jsx
│   │       ├── Reports.jsx
│   │       └── Settings.jsx
│   └── components/
│       ├── Sidebar.jsx
│       └── DashNavbar.jsx
└── package.json
```

### Start Command

```bash
cd telematicshub
npm run dev
```

Open: `http://localhost:5173`

### Environment File (telematicshub/.env)

```
VITE_DEMO_MODE=false
VITE_FIREBASE_API_KEY=AIzaSyDKzMTOk4H_5-XXksvWpUHyXFScTbf6OLc
VITE_FIREBASE_AUTH_DOMAIN=treqzen-iot.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=treqzen-iot
VITE_FIREBASE_STORAGE_BUCKET=treqzen-iot.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=537488009876
VITE_FIREBASE_APP_ID=1:537488009876:web:95d40d91362340dd366281
```

> After changing .env, restart `npm run dev` and do `Ctrl+Shift+R` in browser.

---

## 8. Firebase Setup

### Project

| Setting | Value |
|---------|-------|
| Project ID | treqzen-iot |
| Database | Firestore (Cloud Firestore) |
| Authentication | Email/Password enabled |

### Firestore Document Structure

```
vehicles/
  mritunjay/
    name:         "Hyundai Venue"
    vehicle_id:   "mritunjay"
    status:       "active" | "idle"
    last_seen:    ISO timestamp
    last_reading: {
      rpm, speed, fuel, temp, engine_load,
      throttle, intake_air, battery,
      lat, lng, alcohol_level, mq3_voltage,
      gps_valid, altitude, gps_speed, satellites
    }

sensor_data/
  mritunjay/
    readings/ (subcollection — one doc per POST)
      {auto-id}/  { ...same fields as last_reading... }

alerts/
  {auto-id}/
    vehicle_id, alert_type, severity, message, resolved, created_at
```

### User Account

```
Email:    mritunjay@gmail.com
Password: mritunjay123
```

---

## 9. How to Run Everything

### Complete Startup Sequence

```
1. Connect laptop to "Redmi Note 8 Pro" hotspot (password: oooooooo)
2. Run ipconfig — note Wireless IPv4 address (e.g. 192.168.72.54)
3. If IP changed from 192.168.72.54:
     → Update SERVER_IP in ESP32_Master_Unit.ino
     → Re-upload to ESP32 Master

4. Plug ELM327 OBD adapter into car OBD port (under dash, driver side)
5. Turn car ignition to ON (key position II — don't start engine)
6. Power both ESP32s via USB

7. Start backend:
     cd backend && venv\Scripts\activate
     uvicorn main:app --reload --host 0.0.0.0 --port 8000

8. Start dashboard:
     cd telematicshub && npm run dev

9. Open http://localhost:5173 → login with mritunjay@gmail.com / mritunjay123
10. Go to Overview → see Live OBD Feed panel turn GREEN (LIVE)
```

### Expected Serial Output When Everything Works

**Master ESP32:**
```
[WiFi] CONNECTED! IP: 192.168.72.228
[BT] ELM327 CONNECTED!
[UART] Alcohol:0  GPS:VALID  Sats:9
[HTTP] SUCCESS (201) — total sent: 5
RPM: 820  Speed: 0 km/h  Fuel: 65%  Load: 12.5%  Coolant: 88 C
```

**Slave ESP32:**
```
[MQ3]  raw= 143  volt=0.12V  level=0 (Sober)
[GPS]  VALID| lat=28.613900 lng=77.209100 alt=216.0m spd=0.0km/h sats=9
```

---

## 10. Data Flow

```
Car ECU (CAN bus)
  → OBD-II port
  → ELM327 Bluetooth adapter
  → ESP32 Master (Bluetooth SPP)
  ↑ JSON via UART every 1s
ESP32 Slave (MQ-3 + GPS)
  → HTTP POST every 5s
FastAPI Backend (port 8000)
  → Firestore: vehicles/mritunjay (updates last_reading)
  → Firestore: sensor_data/mritunjay/readings (appends history)
  → Firestore: alerts (creates new alerts if thresholds exceeded)
  ↓ onSnapshot WebSocket
React Dashboard
  → Overview LiveOBDPanel: 10 metrics live
  → VehicleList: Hyundai Venue card with real-time data
  → Alerts section: automatic notifications
```

**Update frequency:**
- Slave → Master: 1 second
- Master → Backend: 5 seconds
- Backend → Firestore: per POST (~5 seconds)
- Firestore → Dashboard: instant (WebSocket push)

---

## 11. Dashboard Features

### Overview Page — Live OBD Feed Panel

Shows 10 live metrics for Hyundai Venue:

| Metric | Source | Color Logic |
|--------|--------|-------------|
| RPM | OBD PID 010C | Green < 3000, Yellow < 6000, Red ≥ 6000 |
| Speed | OBD PID 010D | Blue < 60, Green < 100, Yellow < 130, Red ≥ 130 |
| Coolant Temp | OBD PID 0105 | Blue cold, Green normal, Yellow warm, Red hot |
| Engine Load | OBD PID 0104 | Purple with progress bar |
| Throttle | OBD PID 0111 | Orange with progress bar |
| Intake Air | OBD PID 010F | Cyan |
| Fuel | OBD PID 012F | Yellow/Red with progress bar |
| Battery | ELM327 ATRV | Teal / warning colors |
| Alcohol | MQ-3 via Slave | Green=Sober, Yellow=Trace, Orange=Moderate, Red=High |
| GPS | Neo-6M via Slave | Green if valid (lat/lng + sats + altitude) |

### Vehicle List Page

- **Hyundai Venue** — only vehicle (no fake vehicles)
- Click card → detail modal shows all 10 metrics + GPS + Alcohol
- Status: active (moving) / idle (stopped) / offline (no ESP32)

### Automatic Alerts

Alerts are generated server-side and shown on dashboard:
- Fuel Low / Critical
- Engine Overheating
- Speed Exceeded
- Alcohol Moderate / High
- Insurance / PUC / Fitness document expiry

---

## 12. API Reference

### Backend URLs

```
From browser:    http://localhost:8000
From ESP32:      http://192.168.72.54:8000
Swagger docs:    http://localhost:8000/docs
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| POST | `/api/iot/data/{id}?key=OBD2_ESP32_KEY` | ESP32 data ingest |
| GET | `/api/vehicles/` | All vehicles |
| GET | `/api/alerts/` | All alerts |
| GET | `/api/sensor_data/{id}` | Historical readings |
| GET | `/api/analytics/` | Fleet analytics |
| GET | `/api/maintenance/` | Maintenance records |
| GET | `/api/documents/` | Vehicle documents |

---

## 13. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Sketch too big` error | Default partition too small | Tools → Partition Scheme → Huge APP (3MB No OTA) |
| WiFi dots keep printing | Wrong SSID/pass or hotspot off | Enable hotspot; verify SSID exactly matches |
| ELM327 BT fails | OBD not plugged in or ignition off | Plug OBD in car, turn key to ON |
| HTTP error -1 | Wrong SERVER_IP | Run ipconfig → update SERVER_IP → re-upload |
| Dashboard shows "Waiting..." | Backend not running | Start backend with uvicorn |
| 3 fake vehicles showing | Old data cached | Restart npm run dev + Ctrl+Shift+R |
| GPS "No Fix" | No sky view | Move outdoors, wait 1–3 min |
| MQ-3 always showing High | Sensor not warmed up | Wait 2–3 min after power-on |
| Firebase 401 error | Bad API key in backend | Check `firebase_admin_key.json` in backend/ |

---

*Last updated: March 2026 | TelematicsHub | Hyundai Venue | mritunjay@gmail.com*
