#!/usr/bin/env python3
"""Test token-ops endpoint."""
import json
import urllib.request

API = "https://dotlive-api.onrender.com"

req = urllib.request.Request(
    f"{API}/api/auth/login",
    data=json.dumps({"email": "browserverify@test.com", "password": "Verify123!"}).encode(),
    method="POST",
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req, timeout=30) as r:
    token = json.loads(r.read())["token"]

req = urllib.request.Request(
    f"{API}/api/admin/token-ops?limit=8",
    headers={"Authorization": f"Bearer {token}"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.loads(r.read())
        print(f"Status: {r.status}")
        print(json.dumps(body, indent=2)[:1200])
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()[:800]}")
