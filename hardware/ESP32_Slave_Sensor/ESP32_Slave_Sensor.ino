/*
 * ESP32 #2 — Slave / Sensor Unit
 * ================================
 * Reads:
 *   MQ-3  Alcohol sensor  (GPIO 34, analog)
 *   GPS   Neo-6M module   (UART1: RX=4, TX=2)
 *
 * Sends:
 *   JSON via UART2 (TX=17) to Master ESP32 every 1 second
 *
 * Alcohol Levels:
 *   0 = Sober    (raw < 1000)  — clean air baseline
 *   1 = Trace    (1000–1399)
 *   2 = Moderate (1400–1899)   → triggers alert on dashboard
 *   3 = High     (≥ 1900)      → triggers alert on dashboard
 *
 * Board      : ESP32 Dev Module
 * Baud       : 115200
 * Libraries  : TinyGPS++, ArduinoJson
 *              Install via Arduino IDE → Tools → Manage Libraries
 *
 * Wiring:
 *   ── MQ-3 ──────────────────────────────────────
 *   MQ-3 VCC  → 3.3V (or 5V for better sensitivity)
 *   MQ-3 GND  → GND
 *   MQ-3 AOUT → GPIO 34 (analog only pin)
 *
 *   ── GPS Neo-6M ────────────────────────────────
 *   GPS VCC   → 3.3V
 *   GPS GND   → GND
 *   GPS TX    → GPIO 4  (Slave UART1 RX)
 *   GPS RX    → GPIO 2  (Slave UART1 TX — optional, not needed for read-only)
 *
 *   ── UART to Master ────────────────────────────
 *   Slave GPIO 17 (TX) → Master GPIO 16 (RX)
 *   Slave GPIO 16 (RX) → Master GPIO 17 (TX)
 *   GND ←→ GND
 */

#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>

// ── Pin Definitions ───────────────────────────────────────────────────────────
#define MQ3_PIN        34   // Analog input — alcohol sensor
#define GPS_RX_PIN      4   // GPS TX → this pin
#define GPS_TX_PIN      2   // This pin → GPS RX (optional)
#define MASTER_TX_PIN  17   // Slave TX → Master GPIO 16
#define MASTER_RX_PIN  16   // Slave RX ← Master GPIO 17

// ── Serial Instances ──────────────────────────────────────────────────────────
HardwareSerial GPSSerial(1);    // UART1 for GPS
HardwareSerial MasterSerial(2); // UART2 for Master

// ── GPS Parser ────────────────────────────────────────────────────────────────
TinyGPSPlus gps;

// ── Timing ────────────────────────────────────────────────────────────────────
const unsigned long SEND_INTERVAL = 1000;   // Send to master every 1 second
unsigned long lastSend = 0;

// ─────────────────────────────────────────────────────────────────────────────
// Convert raw MQ-3 ADC value to alcohol level (0–3)
// Calibrate the thresholds below for your specific sensor and environment.
// Allow the sensor to warm up for 2–3 minutes before readings stabilise.
// ─────────────────────────────────────────────────────────────────────────────
int getAlcoholLevel(int raw) {
  if (raw < 1000) return 0;   // Sober    — clean air baseline
  if (raw < 1400) return 1;   // Trace    — slight alcohol presence
  if (raw < 1900) return 2;   // Moderate — caution, verify driver
  return 3;                   // High     — danger, impaired
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n====================================");
  Serial.println("   ESP32 Slave Sensor Unit");
  Serial.println("   MQ-3 Alcohol + GPS → Master");
  Serial.println("====================================\n");

  // GPS on UART1
  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.printf("[GPS] UART1 on RX=%d, TX=%d @ 9600 baud\n", GPS_RX_PIN, GPS_TX_PIN);

  // Master UART on UART2
  MasterSerial.begin(115200, SERIAL_8N1, MASTER_RX_PIN, MASTER_TX_PIN);
  Serial.printf("[UART] Master serial on TX=%d, RX=%d\n", MASTER_TX_PIN, MASTER_RX_PIN);

  // MQ-3 warmup reminder
  Serial.println("[MQ3] Waiting for MQ-3 sensor warmup (2 min recommended)...");
  Serial.println("[GPS] Waiting for GPS fix (may take 1–3 min outdoors)...\n");
  Serial.println("[BOOT] Sensor unit ready. Sending data to Master.");
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  // Continuously feed GPS parser
  while (GPSSerial.available()) {
    gps.encode(GPSSerial.read());
  }

  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();

    // ── MQ-3 Reading ──
    int   mq3_raw      = analogRead(MQ3_PIN);
    float mq3_voltage  = mq3_raw * (3.3f / 4095.0f);
    int   alcohol_level = getAlcoholLevel(mq3_raw);

    // ── GPS Reading ──
    bool  gps_valid   = gps.location.isValid() && gps.location.age() < 2000;
    float lat         = gps_valid ? (float)gps.location.lat()       : 0.0f;
    float lng         = gps_valid ? (float)gps.location.lng()       : 0.0f;
    float altitude    = gps.altitude.isValid()  ? (float)gps.altitude.meters() : 0.0f;
    float gps_speed   = gps.speed.isValid()     ? (float)gps.speed.kmph()      : 0.0f;
    int   satellites  = gps.satellites.isValid() ? (int)gps.satellites.value() : 0;

    // ── Build JSON ──
    JsonDocument doc;
    doc["mq3_raw"]       = mq3_raw;
    doc["mq3_voltage"]   = round(mq3_voltage * 100.0f) / 100.0f;
    doc["alcohol_level"] = alcohol_level;
    doc["gps_valid"]     = gps_valid;
    doc["latitude"]      = lat;
    doc["longitude"]     = lng;
    doc["altitude"]      = altitude;
    doc["speed"]         = gps_speed;
    doc["satellites"]    = satellites;

    String json;
    serializeJson(doc, json);

    // ── Send to Master via UART ──
    MasterSerial.println(json);

    // ── Debug output ──
    Serial.printf("[MQ3]  raw=%4d  volt=%.2fV  level=%d (%s)\n",
      mq3_raw, mq3_voltage, alcohol_level,
      alcohol_level == 0 ? "Sober" :
      alcohol_level == 1 ? "Trace" :
      alcohol_level == 2 ? "Moderate" : "HIGH");

    Serial.printf("[GPS]  %s",  gps_valid ? "VALID " : "NO FIX");
    if (gps_valid) {
      Serial.printf("| lat=%.6f lng=%.6f alt=%.1fm spd=%.1fkm/h sats=%d",
        lat, lng, altitude, gps_speed, satellites);
    }
    Serial.println();
  }
}
