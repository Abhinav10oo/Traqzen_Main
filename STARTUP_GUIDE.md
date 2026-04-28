# Traqzen Startup Guide

## Every time you want to run the project

---

### Step 1 — Connect to Redmi hotspot

Connect your PC to the **Redmi_Note_8_Pro** hotspot before doing anything else.

---

### Step 2 — No IP check needed

The ESP32 now posts directly to the ngrok URL (`those-squirt-smartness.ngrok-free.dev`).
You can connect your PC to **any WiFi network** — no need to be on the same hotspot as the ESP32.

---

### Step 3 — Start the backend

Open a CMD window and run:
```cmd
cd d:\final_project\backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
```
Leave this window open. You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### Step 4 — Start ngrok tunnel

Open a **second** CMD window and run:
```cmd
ngrok http 8000
```
You should see:
```
Forwarding  https://those-squirt-smartness.ngrok-free.dev -> http://localhost:8000
```
Leave this window open too.

> The static domain `https://those-squirt-smartness.ngrok-free.dev` never changes,
> so you only need to set the Vercel env var once (already done).

---

### Step 5 — Make sure vehicle exists in dashboard

1. Open the frontend: https://traqzen-main.vercel.app
2. Log in
3. Go to **Vehicle List** → **Add Vehicle**
4. Set Vehicle ID to exactly: `mritunjay`
5. Save

> You only need to do this once. Skip if the vehicle already exists.

---

### Step 6 — Flash the ESP32 (only if IP changed)

1. Open Arduino IDE
2. Open `hardware/ESP32_Master_Unit/ESP32_Master_Unit.ino`
3. Verify line 49 has the correct IP (from Step 2)
4. Select board: **ESP32 Dev Module**
5. Select the correct COM port
6. Click **Upload**

---

### Step 7 — Power on the ESP32

Connect the ESP32 via USB. Open **Serial Monitor** at **115200 baud**.

Watch for these messages:
- `[WiFi] CONNECTED!` — hotspot connected
- `[BT] ELM327 CONNECTED!` — OBD adapter connected
- `[HTTP] SUCCESS (201)` — data reaching backend

LED blink codes:
- Fast blink → connecting to WiFi
- 2 quick blinks → WiFi connected
- 3 quick blinks → ELM327 connected
- 1 long blink → backend POST success
- 5 rapid blinks → backend POST failed

---

### Step 8 — Open the dashboard

Go to https://traqzen-main.vercel.app and log in. The dashboard should show live data.

---

## Checklist before opening dashboard

- [ ] PC connected to Redmi hotspot
- [ ] Backend running (`uvicorn` CMD window open)
- [ ] ngrok running (second CMD window open)
- [ ] ESP32 flashed with correct IP
- [ ] Vehicle `mritunjay` added in dashboard
- [ ] Serial Monitor shows `[HTTP] SUCCESS (201)`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `uvicorn not recognized` | Run `venv\Scripts\activate` first |
| `[HTTP] FAILED` on ESP32 | Check IP in .ino matches `ipconfig` output |
| Dashboard blank | Check vehicle ID is exactly `mritunjay` |
| ngrok tunnel down | Restart ngrok, same URL will come back |
| Backend crash | Check CMD window for error, restart uvicorn |
