/*
 * ESP32 OBD-II Live Web Dashboard
 * =================================
 * MAC  : 00:10:CC:4F:36:03
 * PIN  : 0000
 * WiFi : OBD2_Dashboard  /  12345678
 * URL  : http://192.168.4.1
 *
 * Shows: RPM · Speed · Coolant Temp · Engine Load
 *        Throttle · Intake Air · Fuel Level · Battery
 *
 * Board   : ESP32 Dev Module
 * Baud    : 115200
 * Libs    : BluetoothSerial, WiFi, WebServer  (all built-in)
 */

#include "BluetoothSerial.h"
#include <WiFi.h>
#include <WebServer.h>

// ── CONFIG ────────────────────────────────────────────────
uint8_t     OBD_MAC[6]  = {0x00, 0x10, 0xCC, 0x4F, 0x36, 0x03};
const char* WIFI_SSID   = "OBD2_Dashboard";
const char* WIFI_PASS   = "12345678";
#define     READ_INTERVAL 1500   // ms between OBD polls
// ──────────────────────────────────────────────────────────

BluetoothSerial SerialBT;
WebServer       server(80);

bool  obdConnected = false;
float vehicleRPM   = 0;
int   vehicleSpeed = 0;
int   coolantTemp  = 0;
int   engineLoad   = 0;
int   throttle     = 0;
int   intakeTemp   = 0;
int   fuelLevel    = 0;
float batteryVolts = 0.0;
unsigned long lastReadTime = 0;

// ── OBD HELPERS ───────────────────────────────────────────

String sendOBDCommand(String cmd) {
  while (SerialBT.available()) SerialBT.read();
  SerialBT.println(cmd);
  String resp = "";
  unsigned long t = millis();
  while (millis() - t < 2000) {
    if (SerialBT.available()) {
      char c = SerialBT.read();
      if (c == '>') break;
      resp += c;
    }
  }
  resp.trim();
  return resp;
}

int parseHexByte(String data, int idx) {
  String clean = "";
  for (char c : data)
    if ((c>='0'&&c<='9')||(c>='A'&&c<='F')||(c>='a'&&c<='f')||c==' ') clean+=c;
  clean.trim();
  int s = clean.indexOf("41");
  if (s == -1) return -1;
  String p = clean.substring(s);
  int pos = 0;
  for (int i = 0; i < idx; i++) {
    pos = p.indexOf(' ', pos);
    if (pos == -1) return -1;
    pos++;
  }
  String hx = p.substring(pos, pos+2);
  hx.trim();
  return (int)strtol(hx.c_str(), NULL, 16);
}

bool initELM327() {
  Serial.println("Initializing ELM327…");
  sendOBDCommand("ATZ");  delay(1000);
  sendOBDCommand("ATE0"); delay(300);
  sendOBDCommand("ATL0"); delay(300);
  sendOBDCommand("ATS1"); delay(300);
  sendOBDCommand("ATSP0");delay(300);
  sendOBDCommand("ATH0"); delay(300);
  String r = sendOBDCommand("0100");
  bool ok = r.indexOf("UNABLE")==-1 && r.indexOf("ERROR")==-1;
  Serial.println(ok ? "ELM327 ready" : "ELM327 warning — check ignition");
  return ok;
}

void readVehicleData() {
  String r;

  r = sendOBDCommand("010C");
  if (r.indexOf("41 0C") != -1) {
    int A = parseHexByte(r,2), B = parseHexByte(r,3);
    if (A!=-1 && B!=-1) vehicleRPM = ((A*256.0)+B)/4.0;
  } delay(80);

  r = sendOBDCommand("010D");
  if (r.indexOf("41 0D") != -1) { int A=parseHexByte(r,2); if(A!=-1) vehicleSpeed=A; }
  delay(80);

  r = sendOBDCommand("0105");
  if (r.indexOf("41 05") != -1) { int A=parseHexByte(r,2); if(A!=-1) coolantTemp=A-40; }
  delay(80);

  r = sendOBDCommand("0104");
  if (r.indexOf("41 04") != -1) { int A=parseHexByte(r,2); if(A!=-1) engineLoad=(A*100)/255; }
  delay(80);

  r = sendOBDCommand("0111");
  if (r.indexOf("41 11") != -1) { int A=parseHexByte(r,2); if(A!=-1) throttle=(A*100)/255; }
  delay(80);

  r = sendOBDCommand("010F");
  if (r.indexOf("41 0F") != -1) { int A=parseHexByte(r,2); if(A!=-1) intakeTemp=A-40; }
  delay(80);

  r = sendOBDCommand("012F");
  if (r.indexOf("41 2F") != -1) { int A=parseHexByte(r,2); if(A!=-1) fuelLevel=(A*100)/255; }
  delay(80);

  r = sendOBDCommand("ATRV"); r.trim();
  if (r.length()>0 && r.indexOf("V")!=-1) batteryVolts = r.toFloat();
}

// ── JSON endpoint ──────────────────────────────────────────

void handleData() {
  String j = "{";
  j += "\"rpm\":"          + String((int)vehicleRPM) + ",";
  j += "\"speed\":"        + String(vehicleSpeed)    + ",";
  j += "\"coolant_temp\":" + String(coolantTemp)     + ",";
  j += "\"engine_load\":"  + String(engineLoad)      + ",";
  j += "\"throttle\":"     + String(throttle)        + ",";
  j += "\"intake_air\":"   + String(intakeTemp)      + ",";
  j += "\"fuel_level\":"   + String(fuelLevel)       + ",";
  j += "\"battery\":"      + String(batteryVolts,1)  + ",";
  j += "\"connected\":"    + (obdConnected?"true":"false");
  j += "}";
  server.sendHeader("Access-Control-Allow-Origin","*");
  server.send(200,"application/json",j);
}

// ── HTML Dashboard ─────────────────────────────────────────

void handleRoot() {
  String html = R"rawhtml(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OBD-II Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e1a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}

/* ── HEADER ── */
header{
  background:rgba(15,20,35,0.95);
  border-bottom:1px solid rgba(255,255,255,0.07);
  padding:12px 20px;
  display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:50;
  backdrop-filter:blur(10px);
}
.h-left{display:flex;align-items:center;gap:10px}
.h-icon{font-size:1.4rem}
.h-title{font-size:1rem;font-weight:700;letter-spacing:-.01em}
.h-sub{font-size:.7rem;color:#64748b;margin-top:1px}
.h-right{display:flex;align-items:center;gap:8px;font-size:.78rem;color:#64748b}
.dot{width:9px;height:9px;border-radius:50%;background:#374151;transition:.4s}
.dot.on{background:#22c55e;box-shadow:0 0 8px #22c55e}
.dot.off{background:#ef4444;box-shadow:0 0 8px #ef4444}
#slabel{transition:.3s}

/* ── LAYOUT ── */
main{padding:20px;max-width:1080px;margin:0 auto}

/* ── TOP ROW: RPM + SPEED big cards ── */
.top-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}

/* ── BOTTOM: 6 small cards ── */
.bot-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:640px){
  .top-row{grid-template-columns:1fr}
  .bot-row{grid-template-columns:1fr 1fr}
}

/* ── CARD BASE ── */
.card{
  background:rgba(15,23,42,0.8);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:16px;
  padding:20px;
  position:relative;
  overflow:hidden;
  transition:transform .15s,box-shadow .15s;
}
.card:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.5)}
.card::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(circle at top right,var(--glow,.1) 0%,transparent 60%);
  pointer-events:none;
}

/* ── RPM CARD (arc gauge) ── */
.rpm-card{--glow:rgba(239,68,68,.08)}
.rpm-card .gauge-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}
.gauge-svg{overflow:visible}
.gauge-track{fill:none;stroke:rgba(255,255,255,.06);stroke-width:10;stroke-linecap:round}
.gauge-fill{fill:none;stroke-width:10;stroke-linecap:round;
  stroke-dasharray:251.2;stroke-dashoffset:251.2;
  transition:stroke-dashoffset .6s ease,stroke .4s;
  transform-origin:center;transform:rotate(-220deg);
}
.rpm-val{font-size:2.6rem;font-weight:800;line-height:1;margin-top:-8px;letter-spacing:-.03em}
.rpm-lbl{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#64748b}
.rpm-max{font-size:.68rem;color:#475569;margin-top:2px}

/* ── SPEED CARD ── */
.spd-card{--glow:rgba(59,130,246,.08);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px}
.spd-num{font-size:5rem;font-weight:900;line-height:1;letter-spacing:-.05em;color:#3b82f6;
  font-variant-numeric:tabular-nums;transition:color .3s}
.spd-unit{font-size:.85rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#64748b}
.spd-lbl{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:#475569}

/* ── SMALL CARD ── */
.s-card{padding:18px}
.s-icon{font-size:1.2rem;margin-bottom:8px;display:block}
.s-label{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px}
.s-val{font-size:2rem;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;transition:color .4s}
.s-unit{font-size:.75rem;color:#475569;margin-top:3px}

/* ── PROGRESS BAR ── */
.bar-wrap{margin-top:10px;height:5px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
.bar-fill{height:100%;border-radius:3px;width:0%;transition:width .6s ease,background .4s}

/* ── TEMP RING indicator ── */
.temp-indicator{display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:6px;vertical-align:middle;transition:background .4s}

/* ── FOOTER ── */
.footer{text-align:center;padding:16px;font-size:.72rem;color:#374151}
</style>
</head>
<body>

<header>
  <div class="h-left">
    <span class="h-icon">🚗</span>
    <div>
      <div class="h-title">OBD-II Dashboard</div>
      <div class="h-sub">ESP32 · MAC 00:10:CC:4F:36:03</div>
    </div>
  </div>
  <div class="h-right">
    <div class="dot off" id="dot"></div>
    <span id="slabel">Connecting…</span>
  </div>
</header>

<main>

  <!-- ── TOP ROW ── -->
  <div class="top-row">

    <!-- RPM ARC GAUGE -->
    <div class="card rpm-card">
      <div class="rpm-lbl" style="margin-bottom:12px;display:flex;align-items:center;gap:6px">
        ⚡ Engine RPM
      </div>
      <div class="gauge-wrap">
        <svg class="gauge-svg" width="200" height="120" viewBox="0 0 200 120">
          <!-- track arc: centre 100,110 radius 80, sweep 220° -->
          <path class="gauge-track"
            d="M 19.7 99.3 A 80 80 0 1 1 180.3 99.3"
          />
          <path class="gauge-fill" id="rpm-arc"
            d="M 19.7 99.3 A 80 80 0 1 1 180.3 99.3"
            stroke="#ef4444"
          />
        </svg>
        <div class="rpm-val" id="rpm" style="color:#ef4444">0</div>
        <div class="rpm-lbl">rpm</div>
        <div class="rpm-max">Max 8000 rpm</div>
      </div>
    </div>

    <!-- SPEED -->
    <div class="card spd-card">
      <div class="spd-lbl">Vehicle Speed</div>
      <div class="spd-num" id="speed">0</div>
      <div class="spd-unit">km / h</div>
    </div>

  </div>

  <!-- ── BOTTOM ROW ── -->
  <div class="bot-row">

    <!-- COOLANT TEMP -->
    <div class="card s-card" style="--glow:rgba(249,115,22,.07)">
      <span class="s-icon">🌡️</span>
      <div class="s-label">Coolant Temp</div>
      <div>
        <span class="s-val" id="coolant_temp" style="color:#f97316">0</span>
        <span class="temp-indicator" id="cool-dot"></span>
      </div>
      <div class="s-unit">°C &nbsp;(normal: 80–100°C)</div>
    </div>

    <!-- ENGINE LOAD -->
    <div class="card s-card" style="--glow:rgba(34,197,94,.07)">
      <span class="s-icon">⚙️</span>
      <div class="s-label">Engine Load</div>
      <div class="s-val" id="engine_load" style="color:#22c55e">0</div>
      <div class="s-unit">%</div>
      <div class="bar-wrap"><div class="bar-fill" id="load-bar" style="background:#22c55e"></div></div>
    </div>

    <!-- THROTTLE -->
    <div class="card s-card" style="--glow:rgba(168,85,247,.07)">
      <span class="s-icon">🎛️</span>
      <div class="s-label">Throttle Position</div>
      <div class="s-val" id="throttle" style="color:#a855f7">0</div>
      <div class="s-unit">%</div>
      <div class="bar-wrap"><div class="bar-fill" id="thr-bar" style="background:#a855f7"></div></div>
    </div>

    <!-- INTAKE AIR -->
    <div class="card s-card" style="--glow:rgba(6,182,212,.07)">
      <span class="s-icon">💨</span>
      <div class="s-label">Intake Air Temp</div>
      <div class="s-val" id="intake_air" style="color:#06b6d4">0</div>
      <div class="s-unit">°C</div>
    </div>

    <!-- FUEL LEVEL -->
    <div class="card s-card" style="--glow:rgba(234,179,8,.07)">
      <span class="s-icon">⛽</span>
      <div class="s-label">Fuel Level</div>
      <div class="s-val" id="fuel_level" style="color:#eab308">0</div>
      <div class="s-unit">%</div>
      <div class="bar-wrap"><div class="bar-fill" id="fuel-bar" style="background:#eab308"></div></div>
    </div>

    <!-- BATTERY -->
    <div class="card s-card" style="--glow:rgba(20,184,166,.07)">
      <span class="s-icon">🔋</span>
      <div class="s-label">Battery Voltage</div>
      <div class="s-val" id="battery" style="color:#14b8a6">0.0</div>
      <div class="s-unit">V &nbsp;(normal: 12.4–14.8V)</div>
    </div>

  </div>

</main>
<div class="footer" id="footer">Waiting for data…</div>

<script>
// Arc gauge math
// Path length of the arc (approximately 251.2 for r=80, 220° sweep)
const ARC_LEN = 251.2;

function setRpmArc(rpm) {
  const pct  = Math.min(rpm / 8000, 1);
  const used = pct * ARC_LEN;
  const offset = ARC_LEN - used;
  const arc = document.getElementById('rpm-arc');
  arc.style.strokeDashoffset = offset;

  // Colour: green→yellow→red
  let col = rpm < 3000 ? '#22c55e' : rpm < 6000 ? '#eab308' : '#ef4444';
  arc.style.stroke = col;
  document.getElementById('rpm').style.color = col;
}

function setBar(id, pct) {
  const b = document.getElementById(id);
  if (b) b.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

function coolantColor(t) {
  if (t < 60)  return '#3b82f6';  // cold  = blue
  if (t <= 100) return '#22c55e'; // normal= green
  if (t <= 110) return '#eab308'; // warm  = yellow
  return '#ef4444';               // hot   = red
}

function speedColor(s) {
  if (s < 60)  return '#3b82f6';
  if (s < 100) return '#22c55e';
  if (s < 130) return '#eab308';
  return '#ef4444';
}

function battColor(v) {
  if (v < 11.5) return '#ef4444';
  if (v < 12.4) return '#eab308';
  if (v > 14.8) return '#f97316';
  return '#14b8a6';
}

function update(d) {
  // Status
  const dot = document.getElementById('dot');
  const lbl = document.getElementById('slabel');
  if (d.connected) {
    dot.className = 'dot on';
    lbl.textContent = 'OBD Connected';
    lbl.style.color = '#22c55e';
  } else {
    dot.className = 'dot off';
    lbl.textContent = 'OBD Disconnected';
    lbl.style.color = '#ef4444';
  }

  // RPM arc gauge
  setRpmArc(d.rpm);
  document.getElementById('rpm').textContent = d.rpm;

  // Speed
  const sEl = document.getElementById('speed');
  sEl.textContent = d.speed;
  sEl.style.color = speedColor(d.speed);

  // Coolant
  const cCol = coolantColor(d.coolant_temp);
  document.getElementById('coolant_temp').textContent = d.coolant_temp;
  document.getElementById('coolant_temp').style.color = cCol;
  document.getElementById('cool-dot').style.background = cCol;

  // Engine load
  document.getElementById('engine_load').textContent = d.engine_load;
  setBar('load-bar', d.engine_load);

  // Throttle
  document.getElementById('throttle').textContent = d.throttle;
  setBar('thr-bar', d.throttle);

  // Intake air
  document.getElementById('intake_air').textContent = d.intake_air;

  // Fuel
  const fCol = d.fuel_level < 15 ? '#ef4444' : d.fuel_level < 30 ? '#eab308' : '#eab308';
  document.getElementById('fuel_level').textContent = d.fuel_level;
  const fb = document.getElementById('fuel-bar');
  fb.style.width   = d.fuel_level + '%';
  fb.style.background = d.fuel_level < 15 ? '#ef4444' : '#eab308';

  // Battery
  const bv = parseFloat(d.battery).toFixed(1);
  const bEl = document.getElementById('battery');
  bEl.textContent = bv;
  bEl.style.color = battColor(d.battery);

  // Footer
  document.getElementById('footer').textContent =
    'Last update: ' + new Date().toLocaleTimeString() + '  ·  Auto-refresh every 1.5 s';
}

async function fetchData() {
  try {
    const r = await fetch('/data');
    update(await r.json());
  } catch(e) {
    document.getElementById('dot').className = 'dot off';
    document.getElementById('slabel').textContent = 'No response';
  }
}

fetchData();
setInterval(fetchData, 1500);
</script>
</body>
</html>)rawhtml";

  server.send(200, "text/html", html);
}

// ── SETUP ─────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n========================================");
  Serial.println("   ESP32 OBD-II Web Dashboard");
  Serial.println("   MAC: 00:10:CC:4F:36:03");
  Serial.println("========================================\n");

  // Bluetooth
  if (!SerialBT.begin("ESP32_OBD_Dash", true)) {
    Serial.println("ERROR: Bluetooth init failed!"); while(1);
  }
  Serial.println("Bluetooth ready (Master mode)");
  SerialBT.setPin("0000", 4);

  Serial.println("Connecting to OBD-II adapter…");
  obdConnected = SerialBT.connect(OBD_MAC);
  if (obdConnected) {
    Serial.println("Bluetooth connected!\n");
    delay(1000);
    initELM327();
  } else {
    Serial.println("WARNING: BT connection failed — will retry in loop\n");
  }

  // WiFi AP
  WiFi.softAP(WIFI_SSID, WIFI_PASS);
  IPAddress ip = WiFi.softAPIP();
  Serial.printf("WiFi AP  : %s  (pw: %s)\n", WIFI_SSID, WIFI_PASS);
  Serial.printf("Dashboard: http://%s\n\n", ip.toString().c_str());

  // Routes
  server.on("/",     handleRoot);
  server.on("/data", handleData);
  server.begin();
  Serial.println("Web server started");
  Serial.println("========================================\n");
}

// ── LOOP ──────────────────────────────────────────────────

void loop() {
  server.handleClient();

  // Auto-reconnect
  if (!obdConnected || !SerialBT.connected()) {
    obdConnected = false;
    Serial.println("OBD disconnected — retrying…");
    if (SerialBT.connect(OBD_MAC)) {
      obdConnected = true;
      Serial.println("OBD reconnected!");
      delay(500);
      initELM327();
    } else {
      delay(4000);
      return;
    }
  }

  // Poll OBD every READ_INTERVAL ms
  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    readVehicleData();
    Serial.printf(
      "RPM:%-6.0f  Spd:%-4d km/h  Cool:%-4d°C  Load:%-3d%%  Thr:%-3d%%  Air:%-4d°C  Fuel:%-3d%%  Bat:%.1fV\n",
      vehicleRPM, vehicleSpeed, coolantTemp, engineLoad,
      throttle, intakeTemp, fuelLevel, batteryVolts
    );
  }
}
