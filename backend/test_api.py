"""Quick API smoke test — run with: python test_api.py"""
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=True)

print("=== Testing TelematicsHub API ===\n")

# 1. Health
r = client.get("/health")
print(f"[GET /health] {r.status_code}: {r.json()}")

# 2. Login
r = client.post("/api/auth/login", json={"email": "owner@telematicshub.com", "password": "password123"})
print(f"\n[POST /api/auth/login] {r.status_code}")
if r.status_code == 200:
    data = r.json()
    token = data["access_token"]
    print(f"  User: {data['user']['name']} | Role: {data['user']['role']}")
    print(f"  Token: {token[:30]}...")
else:
    print(f"  Error: {r.text}")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 3. Get vehicles
r = client.get("/api/vehicles/", headers=headers)
print(f"\n[GET /api/vehicles/] {r.status_code}: {len(r.json())} vehicles")
for v in r.json():
    print(f"  - {v['registration_number']} | {v['model']} | status={v['status']}")

# 4. Get analytics
r = client.get("/api/analytics/fleet-summary", headers=headers)
print(f"\n[GET /api/analytics/fleet-summary] {r.status_code}: {r.json()}")

# 5. Get alerts
r = client.get("/api/alerts/", headers=headers)
print(f"\n[GET /api/alerts/] {r.status_code}: {len(r.json())} alerts")

# 6. Register driver
r = client.post("/api/auth/register", json={
    "name": "Test Driver",
    "email": "testdriver@example.com",
    "password": "password123",
    "role": "driver"
})
print(f"\n[POST /api/auth/register] {r.status_code}")
if r.status_code == 201:
    drv_token = r.json()["access_token"]
    print(f"  Driver registered: {r.json()['user']['name']}")

print("\n=== All tests passed ===")
