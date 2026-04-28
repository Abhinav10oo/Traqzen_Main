/*
 * ESP32 #1 — Master / OBD Unit (ONLINE MODE)
 * ============================================
 * Same as ESP32_Master_Unit but posts to ngrok URL instead of local IP.
 * Works on ANY WiFi network — no need to be on the same hotspot as the backend.
 *
 * Connects to:
 *   1. Any WiFi network
 *   2. ELM327 OBD adapter via Bluetooth
 *   3. Slave ESP32 via UART (RX=16, TX=17)
 *
 * Reads:
 *   OBD-II  → RPM, Speed, Fuel, Engine Load, Coolant Temp
 *   Slave   → Alcohol level (MQ-3), GPS (lat/lng/alt/speed/sats)
 *
 * Sends:
 *   HTTPS POST → ngrok tunnel → FastAPI backend → React Dashboard
 *
 * LED Blink Codes (GPIO 2):
 *   Fast blink = connecting WiFi
 *   2 quick    = WiFi OK
 *   3 quick    = ELM327 BT OK
 *   1 long     = Backend POST OK
 *   5 rapid    = Backend POST FAILED
 *
 * Board      : ESP32 Dev Module
 * Baud       : 115200
 * Partition  : Huge APP (3MB No OTA/1MB SPIFFS)
 * Libraries  : ArduinoJson, BluetoothSerial, WiFi, HTTPClient, WiFiClientSecure
 *
 * Wiring:
 *   Master RX (GPIO 16) ← Slave TX (GPIO 17)
 *   Master TX (GPIO 17) → Slave RX (GPIO 16)
 *   GND ←→ GND  (shared between both ESP32s)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <BluetoothSerial.h>

// ── LED ───────────────────────────────────────────────────────────────────────
#define LED_PIN 2

// ── WiFi ──────────────────────────────────────────────────────────────────────
const char* SSID = "Redmi_Note_8_Pro";
const char* PASS = "qwert93354";

// ── Backend (ngrok — works on any network) ────────────────────────────────────
const char* SERVER_URL = "https://those-squirt-smartness.ngrok-free.dev";
const char* VEHICLE_ID = "mritunjay";
const char* API_KEY    = "OBD2_ESP32_KEY";

// ── UART from Slave ───────────────────────────────────────────────────────────
#define UART_RX 16
#define UART_TX 17
HardwareSerial SensorSerial(2);

// ── ELM327 Bluetooth ──────────────────────────────────────────────────────────
BluetoothSerial ELM327;
uint8_t ELM_MAC[6] = {0x00, 0x10, 0xCC, 0x4F, 0x36, 0x03};

// ── OBD Data ──────────────────────────────────────────────────────────────────
int   rpm          = 0;
int   speed_kmh    = 0;
int   fuel_level   = 0;
float engine_load  = 0.0;
int   coolant_temp = 0;
float battery_v    = 0.0;

// ── Sensor Data (from Slave) ──────────────────────────────────────────────────
int   mq3_raw      = 0;
float mq3_voltage  = 0.0;
int   alcohol_lvl  = 0;
bool  gps_valid    = false;
float latitude     = 0.0;
float longitude    = 0.0;
float altitude_m   = 0.0;
float gps_speed    = 0.0;
int   satellites   = 0;

// ── Flags ─────────────────────────────────────────────────────────────────────
bool elmConnected   = false;
bool sensorReceived = false;
int  lastHttpCode   = 0;
unsigned long totalSent = 0;

// ── Timing ────────────────────────────────────────────────────────────────────
unsigned long lastHTTP    = 0;
unsigned long lastOBD     = 0;
unsigned long lastStatus  = 0;
unsigned long lastBTRetry = 0;
const unsigned long HTTP_INTERVAL     = 5000;
const unsigned long OBD_INTERVAL      = 1000;
const unsigned long STATUS_INTERVAL   = 3000;
const unsigned long BT_RETRY_INTERVAL = 15000;

// ─────────────────────────────────────────────────────────────────────────────
// LED
// ─────────────────────────────────────────────────────────────────────────────
void blinkLED(int times, int onMs, int offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH); delay(onMs);
    digitalWrite(LED_PIN, LOW);  delay(offMs);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Serial Status
// ─────────────────────────────────────────────────────────────────────────────
void printStatus() {
  Serial.println("\n========== MASTER STATUS (ONLINE) ==========");
  Serial.print("WiFi        : ");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("CONNECTED | IP: "); Serial.print(WiFi.localIP());
    Serial.print(" | RSSI: "); Serial.print(WiFi.RSSI()); Serial.println(" dBm");
  } else { Serial.println("DISCONNECTED"); }
  Serial.print("ELM327 BT   : "); Serial.println(elmConnected ? "CONNECTED" : "DISCONNECTED");
  Serial.print("Sensor Unit : "); Serial.println(sensorReceived ? "RECEIVING" : "NO DATA");
  Serial.print("Backend     : ");
  if      (lastHttpCode == 201) { Serial.print("OK (201) | Total sent: "); Serial.println(totalSent); }
  else if (lastHttpCode == 0)   { Serial.println("NOT SENT YET"); }
  else                          { Serial.print("ERROR: "); Serial.println(lastHttpCode); }
  Serial.println("------ OBD ------");
  Serial.printf("RPM: %d  Speed: %d km/h  Fuel: %d%%  Load: %.1f%%  Coolant: %d C  Battery: %.1fV\n",
    rpm, speed_kmh, fuel_level, engine_load, coolant_temp, battery_v);
  Serial.println("------ Sensors ------");
  Serial.printf("Alcohol: %d (%.2fV raw=%d)  GPS: %s\n",
    alcohol_lvl, mq3_voltage, mq3_raw, gps_valid ? "VALID" : "NO FIX");
  if (gps_valid) {
    Serial.printf("Lat: %.6f  Lng: %.6f  Alt: %.1fm  Speed: %.1f km/h  Sats: %d\n",
      latitude, longitude, altitude_m, gps_speed, satellites);
  }
  Serial.println("=============================================\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// WiFi
// ─────────────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to: %s\n", SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASS);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries++ < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] CONNECTED! IP: %s  RSSI: %d dBm\n",
      WiFi.localIP().toString().c_str(), WiFi.RSSI());
    blinkLED(2, 100, 100);
  } else {
    Serial.println("[WiFi] FAILED — check SSID/password");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UART receive from Slave
// ─────────────────────────────────────────────────────────────────────────────
void receiveSensorData() {
  if (!SensorSerial.available()) return;
  String json = SensorSerial.readStringUntil('\n');
  json.trim();
  if (json.length() < 5 || json[0] != '{' || json[json.length()-1] != '}') return;

  JsonDocument doc;
  if (deserializeJson(doc, json)) return;

  mq3_raw     = doc["mq3_raw"]       | 0;
  mq3_voltage = doc["mq3_voltage"]   | 0.0f;
  alcohol_lvl = doc["alcohol_level"] | 0;
  gps_valid   = doc["gps_valid"]     | false;
  latitude    = doc["latitude"]      | 0.0f;
  longitude   = doc["longitude"]     | 0.0f;
  altitude_m  = doc["altitude"]      | 0.0f;
  gps_speed   = doc["speed"]         | 0.0f;
  satellites  = doc["satellites"]    | 0;
  sensorReceived = true;
  Serial.printf("[UART] Alcohol:%d  GPS:%s  Sats:%d\n",
    alcohol_lvl, gps_valid ? "VALID" : "NO FIX", satellites);
}

// ─────────────────────────────────────────────────────────────────────────────
// ELM327
// ─────────────────────────────────────────────────────────────────────────────
void initELM327() {
  Serial.println("[OBD] Initializing ELM327...");
  const char* cmds[] = {"ATZ","ATE0","ATL0","ATS0","ATH0","ATSP0"};
  for (int i = 0; i < 6; i++) {
    ELM327.print(String(cmds[i]) + "\r");
    delay(i == 0 ? 2000 : 100);
    while (ELM327.available()) ELM327.read();
  }
  Serial.println("[OBD] ELM327 initialized OK");
}

String elmQuery(const char* pid) {
  ELM327.print(String(pid) + "\r");
  String resp = "";
  unsigned long t = millis();
  while (millis() - t < 1000) {
    if (ELM327.available()) {
      char c = ELM327.read();
      resp += c;
      if (c == '>') break;
    }
  }
  return resp;
}

bool extractBytes(String& resp, int& a, int& b) {
  resp.replace(" ", ""); resp.trim();
  int idx = resp.indexOf("41");
  if (idx < 0) return false;
  String data = resp.substring(idx + 4);
  if (data.length() < 4) return false;
  a = strtol(data.substring(0, 2).c_str(), NULL, 16);
  b = strtol(data.substring(2, 4).c_str(), NULL, 16);
  return true;
}

void readOBDData() {
  if (!ELM327.connected()) {
    if (elmConnected) { Serial.println("[OBD] ELM327 DISCONNECTED!"); elmConnected = false; }
    return;
  }
  elmConnected = true;
  int a, b; String r;
  r = elmQuery("010C"); if (extractBytes(r, a, b)) rpm          = ((a * 256) + b) / 4;
  r = elmQuery("010D"); if (extractBytes(r, a, b)) speed_kmh    = a;
  r = elmQuery("012F"); if (extractBytes(r, a, b)) fuel_level   = (a * 100) / 255;
  r = elmQuery("0104"); if (extractBytes(r, a, b)) engine_load  = (a * 100.0) / 255.0;
  r = elmQuery("0105"); if (extractBytes(r, a, b)) coolant_temp = a - 40;

  ELM327.print("AT RV\r");
  String rv = "";
  unsigned long t = millis();
  while (millis() - t < 1000) {
    if (ELM327.available()) {
      char c = ELM327.read();
      if (c == '>') break;
      rv += c;
    }
  }
  rv.trim();
  rv.replace("V", ""); rv.replace("\r", ""); rv.replace("\n", ""); rv.trim();
  float parsed = rv.toFloat();
  if (parsed > 6.0 && parsed < 20.0) battery_v = parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTPS POST to ngrok → FastAPI backend
// ─────────────────────────────────────────────────────────────────────────────
void sendToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped — WiFi not connected");
    return;
  }

  JsonDocument doc;
  doc["rpm"]           = rpm;
  doc["speed"]         = speed_kmh;
  doc["fuel"]          = fuel_level;
  doc["temp"]          = coolant_temp;
  doc["engine_load"]   = (int)engine_load;
  doc["throttle"]      = 0;
  doc["intake_air"]    = 0;
  doc["battery"]       = battery_v;
  doc["lat"]           = gps_valid ? latitude  : 0.0;
  doc["lng"]           = gps_valid ? longitude : 0.0;
  doc["alcohol_level"] = alcohol_lvl;
  doc["mq3_voltage"]   = mq3_voltage;
  doc["gps_valid"]     = gps_valid;
  doc["altitude"]      = altitude_m;
  doc["gps_speed"]     = gps_speed;
  doc["satellites"]    = satellites;

  String payload;
  serializeJson(doc, payload);

  String url = SERVER_URL;
  url += "/api/iot/data/";
  url += VEHICLE_ID;
  url += "?key=";
  url += API_KEY;

  Serial.printf("[HTTPS] POST -> %s\n[HTTPS] Payload: %s\n", url.c_str(), payload.c_str());

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(15000);
  HTTPClient http;
  http.begin(client, url);
  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("ngrok-skip-browser-warning", "true");
  lastHttpCode = http.POST(payload);

  if (lastHttpCode == 201) {
    totalSent++;
    Serial.printf("[HTTPS] SUCCESS (201) — total sent: %lu\n", totalSent);
    blinkLED(1, 500, 0);
  } else {
    Serial.printf("[HTTPS] FAILED — code: %d\n", lastHttpCode);
    blinkLED(5, 50, 50);
  }
  http.end();
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n====================================");
  Serial.println("   ESP32 Master Unit (ONLINE MODE)");
  Serial.println("   OBD + Alcohol + GPS -> ngrok");
  Serial.println("====================================\n");

  SensorSerial.begin(115200, SERIAL_8N1, UART_RX, UART_TX);
  Serial.println("[UART] Slave serial on RX=16, TX=17");

  connectWiFi();

  Serial.println("[BT] Starting Bluetooth Master...");
  ELM327.begin("ESP32_Master", true);
  ELM327.setPin("1234", 4);
  Serial.printf("[BT] Connecting to ELM327 MAC: %02X:%02X:%02X:%02X:%02X:%02X\n",
    ELM_MAC[0], ELM_MAC[1], ELM_MAC[2], ELM_MAC[3], ELM_MAC[4], ELM_MAC[5]);

  if (ELM327.connect(ELM_MAC)) {
    elmConnected = true;
    Serial.println("[BT] ELM327 CONNECTED!");
    blinkLED(3, 100, 100);
    delay(1000);
    initELM327();
  } else {
    Serial.println("[BT] ELM327 FAILED — will retry in loop");
  }

  Serial.println("\n[BOOT] Setup complete. Running...\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  receiveSensorData();

  if (millis() - lastOBD >= OBD_INTERVAL) {
    lastOBD = millis();
    readOBDData();
  }

  if (!elmConnected || !ELM327.connected()) {
    if (millis() - lastBTRetry >= BT_RETRY_INTERVAL) {
      lastBTRetry = millis();
      Serial.println("[BT] Retrying ELM327 connection...");
      ELM327.setPin("1234", 4);
      if (ELM327.connect(ELM_MAC)) {
        elmConnected = true;
        Serial.println("[BT] ELM327 reconnected!");
        delay(500); initELM327();
      } else {
        Serial.println("[BT] ELM327 retry failed");
      }
    }
  }

  if (millis() - lastHTTP >= HTTP_INTERVAL) {
    lastHTTP = millis();
    sendToBackend();
  }

  if (millis() - lastStatus >= STATUS_INTERVAL) {
    lastStatus = millis();
    printStatus();
  }
}
