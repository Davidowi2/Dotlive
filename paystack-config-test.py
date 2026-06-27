#!/usr/bin/env python3
"""Test all Paystack-related endpoints end-to-end."""
import json
import urllib.request
import urllib.error

API = "https://dotlive-api.onrender.com"

def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


print("=== 1. Login ===")
status, login = call("POST", "/api/auth/login", body={
    "email": "browserverify@test.com",
    "password": "Verify123!",
})
print(f"  status={status} user={login.get('user', {}).get('email')}")
token = login["token"]
print()

print("=== 2. GET /api/payments/config (public, no auth) ===")
status, cfg = call("GET", "/api/payments/config")
print(f"  status={status}")
print(f"  enabled={cfg.get('enabled')} publicKey={cfg.get('publicKey')[:25] if cfg.get('publicKey') else None}")
print(f"  dotToNaira={cfg.get('dotToNaira')} minDepositDot={cfg.get('minDepositDot')}")
print()

print("=== 3. GET /api/wallet/banks ===")
status, banks = call("GET", "/api/wallet/banks", token=token)
n = len(banks.get("banks", []))
print(f"  status={status} banks_count={n}")
if n > 0:
    print(f"  first: {banks['banks'][0]}")
print()

print("=== 4. POST /api/wallet/verify-bank-account (with dummy data) ===")
status, verified = call(
    "POST", "/api/wallet/verify-bank-account", token=token,
    body={"bankCode": "058", "accountNumber": "0123456789"},
)
print(f"  status={status}")
print(f"  body: {json.dumps(verified, indent=2)[:400]}")
print()

print("=== 5. POST /api/payments/deposit (2000 DOT) ===")
status, deposit = call("POST", "/api/payments/deposit", token=token, body={"amountDot": 2000})
print(f"  status={status}")
print(f"  body: {json.dumps(deposit, indent=2)[:400]}")
