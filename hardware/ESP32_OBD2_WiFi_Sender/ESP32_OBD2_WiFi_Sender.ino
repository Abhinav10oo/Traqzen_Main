/*
 * ESP32 OBD-II → WiFi → TelematicsHub Backend
 * =============================================
 * 1. Connects to your home/office WiFi
 * 2. Connects to OBD-II adapter via Bluetooth (MAC: 00:10:CC:4F:36:03)
 * 3. Reads 8 parameters every 1.5 s
 * 4. POSTs JSON to FastAPI backend → Firestore → React Dashboard
 *
 * Vehicle shown on dashboard: "mritunjay"
 *
 * Board  : ESP32 Dev Module
 * Baud   : 115200
 * Libs   : BluetoothSerial, WiFi, HTTPClient  (all built-in)
 *
 * ── SETUP ──────────────────────────────────────────────────
 * 1. Fill in WIFI_SSID and WIFI_PASS below
 * 2. Find your laptop IP:  run  ipconfig  in CMD, look for IPv4
 *    (e.g. 192.168.1.5)  and paste into SERVER_IP
 * 3. Make sure backend is running:  npm run backend
 *    (or: cd backend && uvicorn main:app --reload --host 0.0.0.0)
 * 4. Upload to ESP32, open Serial Monitor @ 115200
 * 5. Open TelematicsHub dashboard → Overview — see live data!
 */

#include "BluetoothSerial.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ── USER CONFIG ── fill these in ──────────────────────────
const char* WIFI_SSID  = "Redmi Note 8 Pro";      // ← hotspot name
const char* WIFI_PASS  = "oooooooo";              // ← hotspot password
const char* SERVER_IP  = "192.168.72.54";          // ← your laptop's IP while on hotspot
                                                   //   Step: connect laptop to hotspot →
                                                   //   run  ipconfig  in CMD →
                                                   //   look for "Wireless LAN" IPv4 address
                                                   //   (usually 192.168.43.XXX)
                                                   //   then replace X above with that address
const int   SERVER_PORT = 8000;
// ──────────────────────────────────────────────────────────

// OBD-II Bluetooth adapter (confirmed working)
uint8_t OBD_MAC[6] = {0x00, 0x10, 0xCC, 0x4F, 0x36, 0x03};

// Vehicle ID in Firestore / on dashboard
const char* VEHICLE_ID  = "mritunjay";
const char* IOT_API_KEY = "OBD2_ESP32_KEY";

#define READ_INTERVAL 1500  // ms

BluetoothSerial SerialBT;
bool   obdConnected = false;
float  vehicleRPM   = 0;
int    vehicleSpeed = 0;
int    coolantTemp  = 0;
int    engineLoad   = 0;
int    throttle_pct = 0;
int    intakeTemp   = 0;
int    fuelLevel    = 0;
float  batteryVolts = 0.0;
unsigned long lastSendTime = 0;

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
  Serial.println(ok ? "ELM327 ready ✓" : "ELM327 warning — check ignition");
  return ok;
}

void readVehicleData() {
  String r;

  // RPM — 010C → ((A*256)+B)/4
  r = sendOBDCommand("010C");
  if (r.indexOf("41 0C") != -1) {
    int A=parseHexByte(r,2), B=parseHexByte(r,3);
    if (A!=-1&&B!=-1) vehicleRPM=((A*256.0)+B)/4.0;
  } delay(80);

  // Speed — 010D → A km/h
  r = sendOBDCommand("010D");
  if (r.indexOf("41 0D")!=-1){int A=parseHexByte(r,2);if(A!=-1)vehicleSpeed=A;}
  delay(80);

  // Coolant Temp — 0105 → A-40 °C
  r = sendOBDCommand("0105");
  if (r.indexOf("41 05")!=-1){int A=parseHexByte(r,2);if(A!=-1)coolantTemp=A-40;}
  delay(80);

  // Engine Load — 0104 → (A*100)/255 %
  r = sendOBDCommand("0104");
  if (r.indexOf("41 04")!=-1){int A=parseHexByte(r,2);if(A!=-1)engineLoad=(A*100)/255;}
  delay(80);

  // Throttle — 0111 → (A*100)/255 %
  r = sendOBDCommand("0111");
  if (r.indexOf("41 11")!=-1){int A=parseHexByte(r,2);if(A!=-1)throttle_pct=(A*100)/255;}
  delay(80);

  // Intake Air Temp — 010F → A-40 °C
  r = sendOBDCommand("010F");
  if (r.indexOf("41 0F")!=-1){int A=parseHexByte(r,2);if(A!=-1)intakeTemp=A-40;}
  delay(80);

  // Fuel Level — 012F → (A*100)/255 %
  r = sendOBDCommand("012F");
  if (r.indexOf("41 2F")!=-1){int A=parseHexByte(r,2);if(A!=-1)fuelLevel=(A*100)/255;}
  delay(80);

  // Battery — ATRV → float V
  r = sendOBDCommand("ATRV"); r.trim();
  if (r.length()>0 && r.indexOf("V")!=-1) batteryVolts=r.toFloat();
}

// ── HTTP POST to backend ──────────────────────────────────

void sendToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected — skipping POST");
    return;
  }

  String url = "http://";
  url += SERVER_IP;
  url += ":";
  url += SERVER_PORT;
  url += "/api/iot/data/";
  url += VEHICLE_ID;
  url += "?key=";
  url += IOT_API_KEY;

  // Build JSON payload
  String body = "{";
  body += "\"rpm\":"         + String((int)vehicleRPM)  + ",";
  body += "\"speed\":"       + String(vehicleSpeed)     + ",";
  body += "\"temp\":"        + String(coolantTemp)      + ",";
  body += "\"fuel\":"        + String(fuelLevel)        + ",";
  body += "\"engine_load\":" + String(engineLoad)       + ",";
  body += "\"throttle\":"    + String(throttle_pct)     + ",";
  body += "\"intake_air\":"  + String(intakeTemp)       + ",";
  body += "\"battery\":"     + String(batteryVolts, 1)  + ",";
  body += "\"lat\":0,\"lng\":0";
  body += "}";

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(body);

  if (code == 201) {
    Serial.println("✓ Sent to server");
  } else {
    Serial.printf("✗ Server error: HTTP %d\n", code);
  }
  http.end();
}

// ── SETUP ─────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n============================================");
  Serial.println("  ESP32 OBD-II → TelematicsHub Sender");
  Serial.println("  Vehicle: mritunjay");
  Serial.println("============================================\n");

  // WiFi (Station mode — connects to your router)
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("Sending to: http://%s:%d/api/iot/data/%s\n\n", SERVER_IP, SERVER_PORT, VEHICLE_ID);
  } else {
    Serial.println("\nWiFi FAILED — check SSID/password");
  }

  // Bluetooth
  if (!SerialBT.begin("ESP32_OBD_Sender", true)) {
    Serial.println("ERROR: Bluetooth init failed!"); while(1);
  }
  Serial.println("Bluetooth ready (Master mode)");
  SerialBT.setPin("0000", 4);

  Serial.printf("Connecting to OBD: %02X:%02X:%02X:%02X:%02X:%02X\n",
    OBD_MAC[0],OBD_MAC[1],OBD_MAC[2],OBD_MAC[3],OBD_MAC[4],OBD_MAC[5]);

  obdConnected = SerialBT.connect(OBD_MAC);
  if (obdConnected) {
    Serial.println("OBD Bluetooth connected!\n");
    delay(1000);
    initELM327();
  } else {
    Serial.println("WARNING: OBD BT failed — will retry in loop\n");
  }

  Serial.println("============================================");
  Serial.println("  Running — open dashboard Overview page");
  Serial.println("============================================\n");
}

// ── LOOP ──────────────────────────────────────────────────

void loop() {
  // Reconnect OBD if dropped
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

  // Read + send every READ_INTERVAL ms
  if (millis() - lastSendTime >= READ_INTERVAL) {
    lastSendTime = millis();

    readVehicleData();

    Serial.printf(
      "RPM:%-6.0f  Spd:%-4d  Cool:%-4d°C  Load:%-3d%%  Thr:%-3d%%  Air:%-4d°C  Fuel:%-3d%%  Bat:%.1fV\n",
      vehicleRPM, vehicleSpeed, coolantTemp, engineLoad,
      throttle_pct, intakeTemp, fuelLevel, batteryVolts
    );

    sendToServer();
  }
}
