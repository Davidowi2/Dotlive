#!/usr/bin/env python3
"""Test admin stats endpoint."""
import json
import urllib.request

API = "https://dotlive-api.onrender.com"

# Login
req = urllib.request.Request(
    f"{API}/api/auth/login",
    data=json.dumps({"email": "browserverify@test.com", "password": "Verify123!"}).encode(),
    method="POST",
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req, timeout=30) as r:
    login = json.loads(r.read())
token = login["token"]

# Test /api/admin/stats
req = urllib.request.Request(
    f"{API}/api/admin/stats",
    headers={"Authorization": f"Bearer {token}"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode()
        print(f"Status: {r.status}")
        print(f"Body: {body[:800]}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()[:800]}")
