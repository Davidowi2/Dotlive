#!/usr/bin/env python3
"""Quick test."""
import json
import urllib.request
import urllib.error

API = "https://dotlive-api.onrender.com"
EMAIL = "browserverify@test.com"
PASSWORD="Verify123!"

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

# Test promote
req = urllib.request.Request(
    f"{API}/api/admin/users/41a8867c-0b57-4e8b-b151-17eeb4073e27/roles",
    data=json.dumps({"add": ["admin"]}).encode(),
    method="PUT",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"Status: {r.status}")
        print(f"Body: {r.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")

# Test hierarchy
req = urllib.request.Request(
    f"{API}/api/admin/roles/hierarchy",
    headers={"Authorization": f"Bearer {token}"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.loads(r.read())
        print(f"\n=== /api/admin/roles/hierarchy ===")
        print(f"Roles: {len(body.get('roles', []))}, Staff: {len(body.get('staffRoles', []))}, Groups: {len(body.get('permissionGroups', []))}")
        if body.get("staffRoles"):
            print("First staff role:", body["staffRoles"][0]["label"])
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")
