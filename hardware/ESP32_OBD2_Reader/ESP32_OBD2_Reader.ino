/*
 * ESP32 OBD-II Data Reader via Bluetooth
 * ----------------------------------------
 * Connects to ELM327 OBD-II adapter over Bluetooth Classic (SPP)
 * Reads and parses live vehicle data
 * Displays formatted output in Arduino IDE Serial Monitor
 * 
 * Board: ESP32 Dev Module
 * Baud Rate: 115200
 * 
 * SETUP:
 * 1. First run with SCAN_MODE = true to find your OBD-II MAC address
 * 2. Update OBD_MAC[] with your adapter's MAC
 * 3. Set SCAN_MODE = false and upload again
 * 4. Open Serial Monitor at 115200 baud
 */

#include "BluetoothSerial.h"

// ============ CONFIGURATION ============
// Step 1: Set true to scan for OBD adapter MAC address
// Step 2: After finding MAC, set false and update OBD_MAC below
#define SCAN_MODE false

// Replace with YOUR OBD-II adapter's MAC address
// Example: if MAC is AA:BB:CC:DD:EE:FF
uint8_t OBD_MAC[6] = {0x00, 0x10, 0xCC, 0x4F, 0x36, 0x03};

// How often to read data (in milliseconds)
#define READ_INTERVAL 1500
// ========================================

BluetoothSerial SerialBT;
bool isConnected = false;

// Store parsed vehicle data
float vehicleRPM = 0;
int vehicleSpeed = 0;
int coolantTemp = 0;
int fuelLevel = 0;
int throttle = 0;
float voltage = 0;
int engineLoad = 0;
int intakeTemp = 0;

// --------- BLUETOOTH SCAN MODE ---------
void scanForDevices() {
  Serial.println("==========================================");
  Serial.println("   ESP32 OBD-II Bluetooth Scanner");
  Serial.println("==========================================");
  Serial.println("Make sure your OBD-II adapter is powered ON");
  Serial.println("(plugged into car with ignition ON)\n");
  Serial.println("Scanning for Bluetooth devices...\n");

  BTScanResults* results = SerialBT.discover(10000); // 10 sec scan

  if (results && results->getCount() > 0) {
    Serial.println("--- DEVICES FOUND ---");
    for (int i = 0; i < results->getCount(); i++) {
      BTAdvertisedDevice* device = results->getDevice(i);
      Serial.printf("Device %d:\n", i + 1);
      Serial.printf("  Name: %s\n", device->getName().c_str());
      Serial.printf("  MAC : %s\n", device->getAddress().toString().c_str());
      Serial.printf("  RSSI: %d dBm\n\n", device->getRSSI());
    }
    Serial.println("---------------------");
    Serial.println("\nCopy the MAC address of your OBD-II adapter");
    Serial.println("(usually named OBDII, ELM327, V-LINK, etc.)");
    Serial.println("and paste it into OBD_MAC[] in the code.");
  } else {
    Serial.println("No devices found! Make sure:");
    Serial.println("- OBD adapter is plugged into car");
    Serial.println("- Car ignition is ON");
    Serial.println("- Adapter LED is blinking");
  }
}

// --------- SEND OBD COMMAND & GET RESPONSE ---------
String sendOBDCommand(String command) {
  // Clear any old data in buffer
  while (SerialBT.available()) {
    SerialBT.read();
  }

  SerialBT.println(command);

  // Wait for response
  String response = "";
  unsigned long startTime = millis();

  while ((millis() - startTime) < 2000) { // 2 sec timeout
    if (SerialBT.available()) {
      char c = SerialBT.read();
      if (c == '>') break; // ELM327 prompt = response complete
      response += c;
    }
  }

  response.trim();
  return response;
}

// --------- PARSE HEX BYTE FROM RESPONSE ---------
int parseHexByte(String data, int byteIndex) {
  // OBD response format: "41 0C 1A F8"
  // byteIndex 0 = "41", 1 = "0C", 2 = "1A", 3 = "F8"

  // Remove spaces and non-hex characters
  String clean = "";
  for (int i = 0; i < data.length(); i++) {
    char c = data.charAt(i);
    if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f') || c == ' ') {
      clean += c;
    }
  }
  clean.trim();

  // Find the response line starting with "41"
  int startIdx = clean.indexOf("41");
  if (startIdx == -1) return -1;

  String responsePart = clean.substring(startIdx);

  // Split by spaces
  int spaceCount = 0;
  int pos = 0;
  for (int i = 0; i < byteIndex; i++) {
    pos = responsePart.indexOf(' ', pos);
    if (pos == -1) return -1;
    pos++; // skip the space
  }

  // Extract 2-char hex
  String hexByte = responsePart.substring(pos, pos + 2);
  hexByte.trim();

  // Convert hex string to int
  return (int)strtol(hexByte.c_str(), NULL, 16);
}

// --------- INITIALIZE ELM327 ---------
bool initializeELM327() {
  Serial.println("Initializing ELM327...\n");

  String resp;

  // Reset
  resp = sendOBDCommand("ATZ");
  Serial.println("ATZ  -> " + resp);
  delay(1000);

  // Echo off
  resp = sendOBDCommand("ATE0");
  Serial.println("ATE0 -> " + resp);
  delay(300);

  // Linefeed off
  resp = sendOBDCommand("ATL0");
  Serial.println("ATL0 -> " + resp);
  delay(300);

  // Spaces on (easier parsing)
  resp = sendOBDCommand("ATS1");
  Serial.println("ATS1 -> " + resp);
  delay(300);

  // Auto-detect OBD protocol
  resp = sendOBDCommand("ATSP0");
  Serial.println("ATSP0-> " + resp);
  delay(300);

  // Headers off
  resp = sendOBDCommand("ATH0");
  Serial.println("ATH0 -> " + resp);
  delay(300);

  // Read battery voltage (AT command, not OBD PID)
  resp = sendOBDCommand("ATRV");
  Serial.println("Battery Voltage: " + resp);
  delay(300);

  // Test connection with a simple PID
  resp = sendOBDCommand("0100");
  Serial.println("Supported PIDs: " + resp);

  if (resp.indexOf("41 00") != -1) {
    Serial.println("\n>> ELM327 initialized successfully! <<\n");
    return true;
  } else if (resp.indexOf("UNABLE") != -1 || resp.indexOf("ERROR") != -1) {
    Serial.println("\n>> ERROR: Cannot communicate with car ECU <<");
    Serial.println(">> Make sure ignition is ON <<\n");
    return false;
  }

  Serial.println("\n>> ELM327 ready (limited response) <<\n");
  return true;
}

// --------- READ ALL VEHICLE DATA ---------
void readVehicleData() {
  String resp;

  // --- RPM (PID 010C) ---
  resp = sendOBDCommand("010C");
  if (resp.indexOf("41 0C") != -1) {
    int A = parseHexByte(resp, 2);
    int B = parseHexByte(resp, 3);
    if (A != -1 && B != -1) {
      vehicleRPM = ((A * 256.0) + B) / 4.0;
    }
  }
  delay(100);

  // --- Speed (PID 010D) ---
  resp = sendOBDCommand("010D");
  if (resp.indexOf("41 0D") != -1) {
    int A = parseHexByte(resp, 2);
    if (A != -1) {
      vehicleSpeed = A; // km/h
    }
  }
  delay(100);

  // --- Coolant Temperature (PID 0105) ---
  resp = sendOBDCommand("0105");
  if (resp.indexOf("41 05") != -1) {
    int A = parseHexByte(resp, 2);
    if (A != -1) {
      coolantTemp = A - 40; // Celsius
    }
  }
  delay(100);

  // --- Engine Load (PID 0104) ---
  resp = sendOBDCommand("0104");
  if (resp.indexOf("41 04") != -1) {
    int A = parseHexByte(resp, 2);
    if (A != -1) {
      engineLoad = (A * 100) / 255; // percentage
    }
  }
  delay(100);

  // --- Throttle Position (PID 0111) ---
  resp = sendOBDCommand("0111");
  if (resp.indexOf("41 11") != -1) {
    int A = parseHexByte(resp, 2);
    if (A != -1) {
      throttle = (A * 100) / 255; // percentage
    }
  }
  delay(100);

  // --- Intake Air Temperature (PID 010F) ---
  resp = sendOBDCommand("010F");
  if (resp.indexOf("41 0F") != -1) {
    int A = parseHexByte(resp, 2);
    if (A != -1) {
      intakeTemp = A - 40; // Celsius
    }
  }
  delay(100);

  // --- Fuel Level (PID 012F) ---
  resp = sendOBDCommand("012F");
  if (resp.indexOf("41 2F") != -1) {
    int A = parseHexByte(resp, 2);
    if (A != -1) {
      fuelLevel = (A * 100) / 255; // percentage
    }
  }
  delay(100);

  // --- Battery Voltage (AT command) ---
  resp = sendOBDCommand("ATRV");
  resp.trim();
  if (resp.length() > 0 && resp.indexOf("V") != -1) {
    voltage = resp.toFloat();
  }
}

// --------- DISPLAY DATA IN SERIAL MONITOR ---------
void displayData() {
  Serial.println("==========================================");
  Serial.println("       LIVE VEHICLE DATA (OBD-II)");
  Serial.println("==========================================");
  Serial.printf("  RPM          : %.0f rpm\n", vehicleRPM);
  Serial.printf("  Speed        : %d km/h\n", vehicleSpeed);
  Serial.printf("  Coolant Temp : %d °C\n", coolantTemp);
  Serial.printf("  Engine Load  : %d %%\n", engineLoad);
  Serial.printf("  Throttle     : %d %%\n", throttle);
  Serial.printf("  Intake Air   : %d °C\n", intakeTemp);
  Serial.printf("  Fuel Level   : %d %%\n", fuelLevel);
  Serial.printf("  Battery      : %.1f V\n", voltage);
  Serial.println("==========================================");
  Serial.println();
}

// ================== SETUP ==================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n");
  Serial.println("==========================================");
  Serial.println("    ESP32 OBD-II Vehicle Data Reader");
  Serial.println("==========================================\n");

  // Initialize Bluetooth in Master mode
  if (!SerialBT.begin("ESP32_OBD", true)) {
    Serial.println("Bluetooth init failed!");
    while (1); // halt
  }
  Serial.println("Bluetooth initialized (Master mode)\n");

  // ---------- SCAN MODE ----------
  if (SCAN_MODE) {
    scanForDevices();
    Serial.println("\n>> Scan complete. Update OBD_MAC and set SCAN_MODE = false <<");
    while (1); // halt after scan
  }

  // ---------- CONNECT TO OBD-II ----------
  SerialBT.setPin("0000", 4);
  Serial.println("Connecting to OBD-II adapter...");
  Serial.printf("MAC: %02X:%02X:%02X:%02X:%02X:%02X\n\n",
                OBD_MAC[0], OBD_MAC[1], OBD_MAC[2],
                OBD_MAC[3], OBD_MAC[4], OBD_MAC[5]);

  isConnected = SerialBT.connect(OBD_MAC);

  if (isConnected) {
    Serial.println(">> Bluetooth connected! <<\n");
    delay(1000);

    // Initialize ELM327
    if (initializeELM327()) {
      Serial.println("Starting data reading...\n");
    } else {
      Serial.println("ELM327 init issue - will try reading anyway...\n");
    }
  } else {
    Serial.println(">> Connection FAILED! <<");
    Serial.println("Check:");
    Serial.println("  1. OBD adapter is plugged in & powered");
    Serial.println("  2. MAC address is correct");
    Serial.println("  3. No other device is connected to it");
    Serial.println("  4. Run SCAN_MODE to verify MAC\n");
    while (1); // halt
  }
}

// ================== LOOP ==================
void loop() {
  if (!isConnected || !SerialBT.connected()) {
    Serial.println("!! Disconnected from OBD-II !!");
    Serial.println("Attempting reconnect...");
    isConnected = SerialBT.connect(OBD_MAC);
    if (!isConnected) {
      delay(5000);
      return;
    }
    Serial.println("Reconnected!");
    initializeELM327();
  }

  // Read all vehicle parameters
  readVehicleData();

  // Display formatted data
  displayData();

  // Wait before next read
  delay(READ_INTERVAL);
}
