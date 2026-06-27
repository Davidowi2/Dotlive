#!/usr/bin/env python3
"""Test Paystack deposit endpoint."""
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
    token = json.loads(r.read())["token"]

# Try /api/payments/deposit
for amt in [2000, 5000]:
    req = urllib.request.Request(
        f"{API}/api/payments/deposit",
        data=json.dumps({"amountDot": amt}).encode(),
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.loads(r.read())
            print(f"Deposit {amt} DOT: status={r.status}")
            print(f"  Body: {json.dumps(body, indent=2)[:500]}")
    except urllib.error.HTTPError as e:
        print(f"Deposit {amt} DOT: status={e.code}")
        print(f"  Body: {e.read().decode()[:500]}")
    print()
