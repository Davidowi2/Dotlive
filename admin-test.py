#!/usr/bin/env python3
"""Test admin endpoints."""
import json
import urllib.request
import urllib.error

API = "https://dotlive-api.onrender.com"
EMAIL = "browserverify@test.com"
PASSWORD="Veri...n
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

# 1. /api/admin/stats
print("\n=== /api/admin/stats ===")
req = urllib.request.Request(f"{API}/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"Status: {r.status}")
        body = json.loads(r.read())
        print(f"Users total: {body.get('users', {}).get('total')}")
        print(f"Admins: {body.get('users', {}).get('admins')}")
        print(f"Ventures: {body.get('ventures', {}).get('total')}")
        print(f"DOT in circulation: {body.get('wallets', {}).get('totalDot')}")
        print(f"Communities: {body.get('communities', {}).get('total')}")
        print(f"Token ops: {body.get('tokenOps', {}).get('total')}")
        print(f"Recent ops count: {len(body.get('tokenOps', {}).get('recent', []))}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")

# 2. /api/communities (with tier data)
print("\n=== /api/communities ===")
req = urllib.request.Request(f"{API}/api/communities")
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.loads(r.read())
        communities = body.get("communities", [])
        print(f"Total: {len(communities)}")
        if communities:
            sample = communities[0]
            print(f"Sample: {sample.get('name')}")
            print(f"  tier: {sample.get('tier')}")
            print(f"  region: {sample.get('region')}")
            print(f"  category: {sample.get('category')}")
            print(f"  memberCount: {sample.get('memberCount')}")
            print(f"  leader: {sample.get('leader')}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")

# 3. Try promote
print("\n=== POST /api/admin/users/<id>/promote (empty body) ===")
# First, find a non-admin user
req = urllib.request.Request(f"{API}/api/admin/users", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req, timeout=30) as r:
    users_body = json.loads(r.read())
non_admin = next((u for u in users_body.get("users", []) if not u.get("isAdmin") and not u.get("isSuperAdmin")), None)
if non_admin:
    print(f"Testing on user: {non_admin['email']} ({non_admin['id']})")
    req = urllib.request.Request(
        f"{API}/api/admin/users/{non_admin['id']}/promote",
        data=b'{}',  # empty body, no reason
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"Status: {r.status}")
            print(f"Body: {r.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Body: {e.read().decode()}")
