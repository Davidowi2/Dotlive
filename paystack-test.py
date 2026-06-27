#!/usr/bin/env python3
"""Test the Paystack deposit endpoint."""
import json
import urllib.request
import urllib.error

API = "https://dotlive-api.onrender.com"
EMAIL = "browserverify@test.com"
PASSWORD = "Verify123!"

# Login
req = urllib.request.Request(
    f"{API}/api/auth/login",
    data=json.dumps({"email": EMAIL, "password": PASSWORD}).encode(),
    method="POST",
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(req, timeout=30) as r:
    login = json.loads(r.read())

token = login["token"]
print(f"Token: {token[:30]}...")

# Test deposit
req = urllib.request.Request(
    f"{API}/api/payments/deposit",
    data=json.dumps({"amountDot": 1000}).encode(),
    method="POST",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    },
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"\n=== Paystack deposit ===")
        print(f"Status: {r.status}")
        body = json.loads(r.read())
        print(f"Body: {json.dumps(body, indent=2)}")
except urllib.error.HTTPError as e:
    print(f"\n=== Paystack deposit ===")
    print(f"Status: {e.code}")
    body = json.loads(e.read())
    print(f"Body: {json.dumps(body, indent=2)}")
