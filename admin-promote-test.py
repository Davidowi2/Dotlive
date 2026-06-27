#!/usr/bin/env python3
"""Test promote endpoint after fix."""
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
print(f"Token: {token[:30]}...")

# 1. GET roles/hierarchy
print("\n=== /api/admin/roles/hierarchy ===")
req = urllib.request.Request(f"{API}/api/admin/roles/hierarchy", headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.loads(r.read())
        print(f"Total roles: {len(body.get('roles', []))}")
        print(f"Staff roles: {len(body.get('staffRoles', []))}")
        print(f"Permission groups: {len(body.get('permissionGroups', []))}")
        print("First 3 staff roles:")
        for r in body.get("staffRoles", [])[:3]:
            print(f"  - {r['label']}: {len(r['permissions'])} perms")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")

# 2. Find non-admin user
print("\n=== Find non-admin user ===")
req = urllib.request.Request(f"{API}/api/admin/users", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req, timeout=30) as r:
    body = json.loads(r.read())
non_admin = next((u for u in body.get("users", []) if not u.get("isAdmin") and not u.get("isSuperAdmin")), None)
if not non_admin:
    print("No non-admin user found!")
    exit(1)
test_id = non_admin["id"]
print(f"Test user: {non_admin['email']} ({test_id})")

# 3. Promote with new format
print("\n=== PUT /api/admin/users/:id/roles with {add: [admin]} ===")
req = urllib.request.Request(
    f"{API}/api/admin/users/{test_id}/roles",
    data=json.dumps({"add": ["admin"]}).encode(),
    method="PUT",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"Status: {r.status}")
        body = json.loads(r.read())
        print(f"Body: {json.dumps(body, indent=2)}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")

# 4. Verify by GETting user
print("\n=== Verify user is now admin ===")
req = urllib.request.Request(f"{API}/api/admin/users/{test_id}", headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.loads(r.read())
        user = body.get("user", {})
        print(f"isAdmin: {user.get('isAdmin')}")
        print(f"roles: {user.get('roles', [])}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")

# 5. Demote back
print("\n=== PUT /api/admin/users/:id/roles with {remove: [admin]} ===")
req = urllib.request.Request(
    f"{API}/api/admin/users/{test_id}/roles",
    data=json.dumps({"remove": ["admin"]}).encode(),
    method="PUT",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"Status: {r.status}")
        body = json.loads(r.read())
        print(f"Body: {json.dumps(body, indent=2)}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")
