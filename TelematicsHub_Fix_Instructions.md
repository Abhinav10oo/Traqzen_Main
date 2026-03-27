# TelematicsHub — Master Fix & Migration Instruction Prompt

> **Purpose:** A step-by-step instruction set to fix all architectural problems in the existing TelematicsHub project without rebuilding from scratch. Follow each phase in order. Do not skip phases.

---

## CONTEXT (Read This First)

The existing project has the following confirmed problems that must be fixed:

| #   | Problem                                                                                     | Location                                                                                       |
| --- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Split-brain auth: Firebase on frontend, separate JWT+SQLite on backend — they don't connect | `backend/core/security.py`, `backend/routers/auth.py`, `frontend/src/contexts/AuthContext.jsx` |
| 2   | Alcohol sensor logic present everywhere — must be fully removed                             | Backend models, routers, schemas, MQTT payload, frontend data/fakeData.js, simulator, UI       |
| 3   | Tyre pressure (TPMS) logic present everywhere — must be fully removed                       | Same as above                                                                                  |
| 4   | Document uploads go to local disk — must go to Firebase Storage                             | `backend/routers/documents.py`, frontend UploadDocuments.jsx                                   |
| 5   | SQLite + SQLAlchemy used for data — must be replaced by Firestore                           | All backend models/, database.py, routers that do DB queries                                   |
| 6   | No real IoT-to-Firestore bridge — MQTT data never reaches Firebase                          | `backend/mqtt/mqtt_handler.py`                                                                 |
| 7   | Demo mode and real mode have no clean switch                                                | `frontend/src/contexts/DataContext.jsx`                                                        |
| 8   | Backend does too much — needs to become a thin IoT bridge only                              | Entire backend structure                                                                       |

---

## PHASE 1 — Firebase Project Setup (Do This Manually First)

Before touching any code, complete these steps in the Firebase Console:

### 1.1 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project" → Name it `TelematicsHub`
3. Disable Google Analytics (not needed)

### 1.2 — Enable Authentication

1. In Firebase Console → Authentication → Get Started
2. Sign-in method → Enable **Email/Password**

### 1.3 — Enable Firestore

1. Firestore Database → Create Database
2. Start in **Test Mode** (you'll add security rules later)
3. Choose region closest to India: `asia-south1`

### 1.4 — Enable Firebase Storage

1. Storage → Get Started
2. Start in Test Mode
3. Same region: `asia-south1`

### 1.5 — Get Frontend Config

1. Project Settings → Your Apps → Add Web App → Name it `telematicshub-web`
2. Copy the config object — you'll need it in Step 2.1

### 1.6 — Get Backend Service Account Key

1. Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Rename it to `firebase_admin_key.json`
5. Place it in `backend/` folder
6. **Add `firebase_admin_key.json` to your `.gitignore` immediately**

---

## PHASE 2 — Frontend Firebase Configuration Fix

### 2.1 — Fix `frontend/src/firebase.js`

Replace the entire file with:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### 2.2 — Create `frontend/.env`

Create this file in the frontend root (never commit it):

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2.3 — Add to `frontend/.gitignore`

```
.env
.env.local
```

---

## PHASE 3 — Fix Auth Context (Remove Split-Brain)

### 3.1 — Replace `frontend/src/contexts/AuthContext.jsx`

The old version may store extra user data in a separate backend call after Firebase login. Remove all backend API calls from this file. It should only use Firebase Auth:

```jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up — creates Firebase Auth user AND a Firestore profile doc
  async function signup(email, password, name, role = "owner") {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    // Write user profile to Firestore
    await setDoc(doc(db, "users", credential.user.uid), {
      name,
      email,
      role, // "owner" or "driver"
      phone: "",
      createdAt: new Date().toISOString(),
    });
    return credential;
  }

  // Login — Firebase only, no backend call
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load user profile from Firestore
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data());
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, userProfile, signup, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

**What changed:** No backend API calls. No JWT storage. No localStorage token management. Firebase handles everything.

---

## PHASE 4 — Fix Backend: Remove SQLite, Add Firebase Admin

### 4.1 — Update `backend/requirements.txt`

Remove these packages (no longer needed):

```
# REMOVE:
SQLAlchemy
python-jose
passlib
bcrypt
python-multipart
Pillow
alembic  # if present
```

Add these packages:

```
# ADD:
firebase-admin==6.5.0
```

Final `requirements.txt` should look like:

```
fastapi==0.115.0
uvicorn==0.32.0
paho-mqtt==2.1.0
apscheduler==3.10.0
pydantic==2.10.0
python-dotenv==1.0.0
firebase-admin==6.5.0
```

### 4.2 — Create `backend/core/firebase_admin.py`

This is the new "database connection" file — replaces `database.py`:

```python
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase Admin SDK (only once)
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase_admin_key.json")
    firebase_admin.initialize_app(cred)

# Export Firestore client and Auth
db  = firestore.client()
fa  = auth   # Firebase Admin Auth — used to verify tokens
```

### 4.3 — Delete These Files (No Longer Needed)

```
backend/database.py               ← DELETE
backend/core/security.py          ← DELETE
backend/models/                   ← DELETE entire folder
backend/schemas/                  ← DELETE entire folder (rebuild minimal ones)
backend/routers/auth.py           ← DELETE (Firebase handles auth now)
```

### 4.4 — Create `backend/core/dependencies.py` (New Version)

This replaces the old JWT dependency with Firebase token verification:

```python
from fastapi import HTTPException, Header
from firebase_admin import auth as fa
from backend.core.firebase_admin import db

async def get_current_user(authorization: str = Header(...)):
    """
    Verify Firebase ID Token sent from frontend.
    Frontend must send: Authorization: Bearer <Firebase ID Token>
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header format")

    token = authorization.split("Bearer ")[1]

    try:
        decoded = fa.verify_id_token(token)
        return decoded  # contains uid, email, etc.
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")
```

### 4.5 — Update `backend/core/config.py`

Remove all database, JWT, and password-related settings. Keep only:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MQTT
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883

    # Alert thresholds
    FUEL_ALERT_THRESHOLD: float  = 25.0
    ENGINE_TEMP_MAX: float       = 90.0
    SPEED_LIMIT: float           = 100.0

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## PHASE 5 — Remove Alcohol & Tyre Pressure Everywhere

This must be done in EVERY file that mentions these. Search the entire project for:

- `alcohol` / `alcohol_level` / `ALCOHOL_THRESHOLD` / `MQ3`
- `tire_pressure` / `tyre_pressure` / `TPMS` / `tire_alert`

### 5.1 — Backend MQTT Payload (New Clean Version)

In `backend/mqtt/mqtt_handler.py`, the expected payload changes from:

```json
{
  "lat": 0,
  "lng": 0,
  "speed": 0,
  "fuel": 0,
  "temp": 0,
  "alcohol": 0.0,
  "rpm": 0,
  "token": ""
}
```

To:

```json
{
  "lat": 0,
  "lng": 0,
  "speed": 0,
  "fuel": 0,
  "temp": 0,
  "rpm": 0,
  "device_token": ""
}
```

Remove all alcohol threshold checks from `alert_service.py`.

### 5.2 — Frontend fakeData.js

Find and remove all fields:

- `alcohol: ...`
- `alcoholLevel: ...`
- `tirePresure: ...` / `tirePressure: ...`
- Any alert of type `"alcohol_detected"` or `"tire_pressure_low"`

### 5.3 — Frontend liveSimulator.js

Remove:

- Any alcohol value generation
- Any tire pressure value generation
- Any alert triggers for alcohol or tyre pressure

### 5.4 — Frontend UI Components

Search all `.jsx` files for any display of alcohol readings or tire pressure gauges and remove those UI elements. This includes:

- `VehicleList.jsx` — remove alcohol/tyre pressure from vehicle detail modal
- `Overview.jsx` — remove from live telemetry ticker if present
- `Analytics.jsx` — remove from charts/graphs
- `Settings.jsx` — remove ALCOHOL_THRESHOLD from threshold settings

---

## PHASE 6 — Rebuild MQTT Handler (IoT → Firestore Bridge)

### 6.1 — Replace `backend/mqtt/mqtt_handler.py`

```python
import json
import paho.mqtt.client as mqtt
from backend.core.firebase_admin import db
from backend.services.alert_service import check_and_create_alerts
from backend.core.config import settings
from datetime import datetime, timezone

TOPIC = "telematicshub/vehicles/+/data"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        client.subscribe(TOPIC)
        print(f"[MQTT] Connected and subscribed to {TOPIC}")
    else:
        print(f"[MQTT] Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())

        # Extract vehicle_id from topic: telematicshub/vehicles/{id}/data
        topic_parts = msg.topic.split("/")
        vehicle_id = topic_parts[2]

        # Build clean sensor reading (no alcohol, no tyre pressure)
        reading = {
            "vehicle_id":  vehicle_id,
            "timestamp":   datetime.now(timezone.utc).isoformat(),
            "lat":         float(payload.get("lat", 0)),
            "lng":         float(payload.get("lng", 0)),
            "speed":       float(payload.get("speed", 0)),
            "fuel":        float(payload.get("fuel", 0)),
            "temp":        float(payload.get("temp", 0)),
            "rpm":         int(payload.get("rpm", 0)),
        }

        # Write to Firestore: sensor_data/{vehicle_id}/readings/{auto_id}
        db.collection("sensor_data") \
          .document(vehicle_id) \
          .collection("readings") \
          .add(reading)

        # Update vehicle's last_seen and live status
        db.collection("vehicles").document(vehicle_id).set({
            "last_seen": reading["timestamp"],
            "status": "active",
            "last_reading": reading,
        }, merge=True)

        # Run alert checks
        check_and_create_alerts(vehicle_id, reading)

        print(f"[MQTT] Saved reading for vehicle {vehicle_id}")

    except Exception as e:
        print(f"[MQTT] Error processing message: {e}")

def start_mqtt_client():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
    client.loop_start()
    return client
```

---

## PHASE 7 — Rebuild Alert Service (Clean Version)

### 7.1 — Replace `backend/services/alert_service.py`

```python
from backend.core.firebase_admin import db
from backend.core.config import settings
from datetime import datetime, timezone

def check_and_create_alerts(vehicle_id: str, reading: dict):
    alerts = []

    # Fuel alerts
    if reading["fuel"] < 15:
        alerts.append(("fuel_critical", "danger",  f"Fuel critically low: {reading['fuel']}%"))
    elif reading["fuel"] < settings.FUEL_ALERT_THRESHOLD:
        alerts.append(("fuel_low",      "warning", f"Fuel low: {reading['fuel']}%"))

    # Engine temperature alerts
    if reading["temp"] > 100:
        alerts.append(("temp_critical", "danger",  f"Engine overheating: {reading['temp']}°C"))
    elif reading["temp"] > settings.ENGINE_TEMP_MAX:
        alerts.append(("temp_high",     "warning", f"High engine temp: {reading['temp']}°C"))

    # Speed alerts
    if reading["speed"] > settings.SPEED_LIMIT:
        alerts.append(("speed_exceeded", "warning", f"Speed limit exceeded: {reading['speed']} km/h"))

    # Write alerts to Firestore
    for alert_type, severity, message in alerts:
        db.collection("alerts").add({
            "vehicle_id":  vehicle_id,
            "type":        alert_type,
            "severity":    severity,
            "message":     message,
            "resolved":    False,
            "timestamp":   datetime.now(timezone.utc).isoformat(),
        })
```

---

## PHASE 8 — Fix Document Upload (Local Disk → Firebase Storage)

### 8.1 — Remove `backend/routers/documents.py` Upload Logic

The backend no longer handles file uploads. Delete all file upload code from the backend.

### 8.2 — Update `frontend/src/pages/dashboard/UploadDocuments.jsx`

Replace any `fetch('/api/documents', ...)` call with direct Firebase Storage upload:

```javascript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { storage, db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

// Inside your upload handler function:
async function handleUpload(file, vehicleId, docType, expiryDate) {
  // 1. Upload file to Firebase Storage
  const storageRef = ref(
    storage,
    `documents/${vehicleId}/${docType}_${Date.now()}`,
  );
  const snapshot = await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(snapshot.ref);

  // 2. Save metadata to Firestore
  await addDoc(collection(db, "documents"), {
    vehicle_id: vehicleId,
    type: docType, // "insurance" | "pollution" | "fitness"
    expiry_date: expiryDate,
    file_url: fileUrl,
    uploaded_at: new Date().toISOString(),
    uploaded_by: currentUser.uid,
  });
}
```

---

## PHASE 9 — Fix DataContext (Clean Demo/Real Switch)

### 9.1 — Update `frontend/src/contexts/DataContext.jsx`

Add a clean mode switch at the top of the file:

```javascript
// ─── MODE SWITCH ──────────────────────────────────────────────
// Set to true  → use fake data + live simulator (no Firebase needed)
// Set to false → use real Firestore data with live listeners
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
// ──────────────────────────────────────────────────────────────
```

Add to `frontend/.env`:

```env
VITE_DEMO_MODE=true
```

When `DEMO_MODE = false`, replace all fake data reads with Firestore `onSnapshot()` listeners:

```javascript
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

// Example: real-time vehicle listener
useEffect(() => {
  if (DEMO_MODE) return; // skip in demo mode

  const unsubscribe = onSnapshot(collection(db, "vehicles"), (snapshot) => {
    const vehicles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setVehicles(vehicles);
  });

  return () => unsubscribe(); // cleanup on unmount
}, []);
```

---

## PHASE 10 — Fix `backend/main.py` (Clean Entry Point)

Replace the entire file:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.core.firebase_admin import db     # initializes Firebase Admin on import
from backend.mqtt.mqtt_handler import start_mqtt_client
from backend.routers import vehicles, sensor_data, alerts, drivers, trips, maintenance, documents, analytics

mqtt_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global mqtt_client
    mqtt_client = start_mqtt_client()
    print("[Server] MQTT client started")
    yield
    if mqtt_client:
        mqtt_client.loop_stop()
        print("[Server] MQTT client stopped")

app = FastAPI(title="TelematicsHub API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount only the routers that still make sense with Firestore backend
# (auth router is GONE — Firebase handles auth)
app.include_router(vehicles.router,     prefix="/api/vehicles")
app.include_router(sensor_data.router,  prefix="/api/sensor-data")
app.include_router(alerts.router,       prefix="/api/alerts")
app.include_router(trips.router,        prefix="/api/trips")
app.include_router(maintenance.router,  prefix="/api/maintenance")
app.include_router(documents.router,    prefix="/api/documents")
app.include_router(analytics.router,    prefix="/api/analytics")

@app.get("/health")
def health():
    return {"status": "ok", "mode": "firebase"}
```

---

## PHASE 11 — Firestore Data Seeder (Replace Old SQLite Seeder)

### 11.1 — Update `frontend/src/utils/seedFirestore.js`

This script seeds Firestore with demo vehicles on first run. Remove all alcohol and tyre pressure fields:

```javascript
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const DEMO_VEHICLES = [
  {
    id: "V001",
    registration: "MH 12 AB 1234",
    model: "Tata Nexon",
    year: 2022,
    driver: "Arjun Sharma",
    status: "active",
    fuel: 72,
    temp: 88,
    speed: 48,
    rpm: 2400,
    lat: 19.076,
    lng: 72.877,
    insurance_expiry: "2025-08-15",
    pollution_expiry: "2025-03-20",
    fitness_expiry: "2026-01-10",
  },
  // ... add V002–V006 with same structure, no alcohol, no tyre_pressure
];

export async function seedFirestoreIfEmpty() {
  const snap = await getDocs(collection(db, "vehicles"));
  if (!snap.empty) return; // already seeded

  for (const vehicle of DEMO_VEHICLES) {
    const { id, ...data } = vehicle;
    await setDoc(doc(db, "vehicles", id), data);
  }
  console.log("[Seed] Firestore seeded with demo vehicles");
}
```

Call this once in `App.jsx` after auth loads:

```javascript
import { seedFirestoreIfEmpty } from "./utils/seedFirestore";
// Inside useEffect after user is confirmed:
seedFirestoreIfEmpty();
```

---

## PHASE 12 — Backend `.env` File (Clean Version)

Create `backend/.env`:

```env
# MQTT Broker
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883

# Alert Thresholds
FUEL_ALERT_THRESHOLD=25
ENGINE_TEMP_MAX=90
SPEED_LIMIT=100

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

---

## PHASE 13 — Update `.gitignore` Files

### `backend/.gitignore`

```
firebase_admin_key.json
.env
__pycache__/
venv/
*.db
uploads/
```

### `frontend/.gitignore`

```
.env
.env.local
node_modules/
dist/
```

---

## Final Checklist Before Testing

Go through every item:

- [ ] Firebase project created with Auth, Firestore, Storage enabled
- [ ] `frontend/.env` filled with Firebase config values
- [ ] `backend/firebase_admin_key.json` placed in backend folder
- [ ] `firebase_admin_key.json` added to `.gitignore`
- [ ] `alcohol` removed from: fakeData.js, liveSimulator.js, mqtt payload, all UI components
- [ ] `tire_pressure` / `tyre_pressure` removed from: same as above
- [ ] `backend/database.py` deleted
- [ ] `backend/core/security.py` deleted
- [ ] `backend/models/` folder deleted
- [ ] `backend/routers/auth.py` deleted
- [ ] Firebase Admin SDK initialized in `backend/core/firebase_admin.py`
- [ ] All backend routers now use `get_current_user` from new `dependencies.py`
- [ ] Document uploads use Firebase Storage (not local disk)
- [ ] `DEMO_MODE` flag exists in DataContext and `.env`
- [ ] `seedFirestore.js` has no alcohol or tyre pressure fields
- [ ] `backend/requirements.txt` updated (removed SQLAlchemy, jose, passlib, bcrypt)
- [ ] `firebase-admin` added to `requirements.txt`

---

## Architecture After All Fixes

```
┌──────────────────────────────────────────────┐
│           Browser (React + Vite)             │
│                                              │
│  Login/Signup ──► Firebase Auth              │
│  Dashboard    ──► Firestore (onSnapshot)     │
│  Doc Upload   ──► Firebase Storage           │
│                                              │
│  DEMO_MODE=true  → fakeData + liveSimulator  │
│  DEMO_MODE=false → real Firestore listeners  │
└──────────────┬───────────────────────────────┘
               │ REST /api/* + Firebase ID Token
               ▼
┌──────────────────────────────────────────────┐
│      FastAPI Backend (Thin IoT Bridge)       │
│                                              │
│  Verifies Firebase ID Token on all routes   │
│  MQTT Client ◄── ESP32 IoT device            │
│  Alert Engine → writes to Firestore          │
│  (No SQLite, No JWT, No local storage)       │
└──────────────┬───────────────────────────────┘
               │ Firebase Admin SDK
               ▼
┌──────────────────────────────────────────────┐
│              Firebase (Google Cloud)         │
│                                              │
│  Auth      → user identity & sessions       │
│  Firestore → all structured data             │
│  Storage   → document files (PDF, images)   │
└──────────────────────────────────────────────┘
               ▲
               │ MQTT over TCP
┌──────────────┴───────────────────────────────┐
│          ESP32 in Vehicle                    │
│  Publishes: lat, lng, speed, fuel, temp, rpm │
│  Topic: telematicshub/vehicles/{id}/data     │
└──────────────────────────────────────────────┘
```

---

## New IoT Payload (ESP32 → MQTT)

```json
{
  "lat": 19.076,
  "lng": 72.877,
  "speed": 48.5,
  "fuel": 72,
  "temp": 88,
  "rpm": 2400,
  "device_token": "<unique_device_token>"
}
```

**Removed from old payload:** `alcohol` field completely gone.
**Removed from old payload:** No tyre pressure field (was optional before, now explicitly excluded).

---

_End of TelematicsHub Fix Instructions — Follow phases 1 through 13 in order._
