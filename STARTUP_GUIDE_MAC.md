# Traqzen Startup Guide — macOS

## What you need to install (one-time setup)

---

### 1. Homebrew (Mac package manager)

Open **Terminal** and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Follow the prompts. This takes a few minutes.

---

### 2. Python 3

```bash
brew install python
```

Verify it worked:
```bash
python3 --version
```
You should see `Python 3.x.x`. If you see 3.8 or higher, you're good.

---

### 3. ngrok

```bash
brew install ngrok/ngrok/ngrok
```

Then connect your ngrok account (do this once):
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```
Get your authtoken from: https://dashboard.ngrok.com/authtokens

---

### 4. Node.js and npm (for frontend)

```bash
brew install node
```

Verify:
```bash
node --version
npm --version
```
You should see v18 or higher for Node.

---

### 5. Git (usually pre-installed on Mac)

```bash
git --version
```
If not installed, Mac will prompt you to install Xcode Command Line Tools — click Install.

---

## One-time project setup (do this once after cloning)

---

### Step 1 — Clone the project from GitHub

Open Terminal and run:
```bash
git clone https://github.com/Abhinav10oo/Traqzen_Main.git
cd Traqzen_Main
```

This downloads the full project to your Mac.

---

### Step 2 — Create Python virtual environment

```bash
cd /path/to/final_project/backend
python3 -m venv venv
```

---

### Step 3 — Activate venv and install dependencies

```bash
source venv/bin/activate
pip install -r requirements.txt
```

You should see all packages installing including fastapi, uvicorn, twilio, etc.

> **Note:** On Mac, always use `source venv/bin/activate` (not `venv\Scripts\activate` which is Windows-only)

---

### Step 4 — Set up environment variables

Check if there is a `.env` file in the backend folder:
```bash
ls backend/.env
```

If it does not exist, create one:
```bash
cp backend/.env.example backend/.env
```
Then open it and fill in your values (Twilio credentials, secret key, etc.)

---

### Step 5 — Install frontend dependencies

```bash
cd /path/to/final_project/frontend
npm install
```

This installs React, Vite, and all other frontend packages. Only needed once (or after pulling new changes).

---

## Every time you want to run the project

---

### Step 1 — Connect ESP32 to Redmi hotspot

Make sure the Redmi phone's mobile data is ON and the hotspot is broadcasting.

---

### Step 2 — Start the backend

Open a Terminal window:
```bash
cd /path/to/final_project/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Leave this Terminal open. You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Test it by opening http://localhost:8000 in your browser — you should see the welcome message.

---

### Step 3 — Start ngrok tunnel

Open a **second** Terminal window:
```bash
ngrok http 8000
```

Wait until you see:
```
Forwarding  https://those-squirt-smartness.ngrok-free.dev -> http://localhost:8000
```

Leave this Terminal open too.

> The static domain never changes so you never need to update the ESP32 code.

---

### Step 4 — Make sure vehicle exists in dashboard

1. Open https://traqzen-main.vercel.app
2. Log in
3. Go to **Vehicle List** → **Add Vehicle**
4. Set Vehicle ID to exactly: `mritunjay`
5. Save

> Skip this if the vehicle already exists.

---

### Step 5 — Power on the ESP32

Connect the ESP32 via USB. If you want to monitor it, install Arduino IDE on Mac and open Serial Monitor at **115200 baud**.

Watch for:
- `[WiFi] CONNECTED!`
- `[HTTPS] SUCCESS (201)` or `[HTTP] SUCCESS (201)`

---

### Step 6 — Option A: Use the hosted dashboard (easiest)

Go to https://traqzen-main.vercel.app and log in. No setup needed — it talks to the ngrok URL automatically.

---

### Step 6 — Option B: Run the frontend locally

If you want to run the frontend on your Mac instead of using Vercel:

Open a **third** Terminal window:
```bash
cd /path/to/final_project/frontend
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

> **Note:** When running locally, make sure the frontend's API URL points to your ngrok URL.
> Check `frontend/src/lib/api.js` — the `BASE_URL` should be `https://those-squirt-smartness.ngrok-free.dev`

---

## Checklist before opening dashboard

- [ ] Mobile data ON on Redmi phone
- [ ] Backend running (`uvicorn` Terminal open)
- [ ] ngrok running (second Terminal open, showing forwarding URL)
- [ ] Vehicle `mritunjay` exists in dashboard
- [ ] ESP32 powered on and showing SUCCESS in serial monitor
- [ ] (If running locally) Frontend running on http://localhost:5173

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `command not found: python3` | Run `brew install python` |
| `command not found: uvicorn` | Run `source venv/bin/activate` first |
| `command not found: ngrok` | Run `brew install ngrok/ngrok/ngrok` |
| `ngrok: command not found` after brew install | Restart Terminal or run `brew link ngrok` |
| `No module named fastapi` | Run `pip install -r requirements.txt` inside activated venv |
| `pip: command not found` | Use `pip3` instead of `pip` |
| Backend starts but ESP32 shows ERROR -1 | Check mobile data is ON on Redmi phone |
| Dashboard blank / no data | Check vehicle ID is exactly `mritunjay` |
| ngrok tunnel shows but no POST requests | ESP32 not connected to internet (check hotspot data) |
| Port 8000 already in use | Run `lsof -i :8000` then `kill -9 PID` to free the port |
| Permission denied on venv | Run `chmod +x venv/bin/activate` then retry |
| `command not found: npm` | Run `brew install node` |
| `npm install` fails with EACCES | Run `sudo chown -R $USER ~/.npm` then retry |
| Frontend blank page locally | Check browser console for CORS errors; make sure ngrok is running |
| `vite: command not found` | Run `npm install` inside the frontend folder first |
| Port 5173 already in use | Run `lsof -i :5173` then `kill -9 PID` |

---

## Key differences from Windows

| Task | Windows | Mac |
|---|---|---|
| Activate venv | `venv\Scripts\activate` | `source venv/bin/activate` |
| Install ngrok | Download .exe manually | `brew install ngrok/ngrok/ngrok` |
| Install Python | Download installer from python.org | `brew install python` |
| Terminal | CMD or PowerShell | Terminal (or iTerm2) |
| File paths | `d:\final_project\backend` | `/Users/yourname/final_project/backend` |
| Kill process on port | `netstat -ano` + Task Manager | `lsof -i :8000` + `kill -9 PID` |
