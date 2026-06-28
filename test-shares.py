import json, urllib.request, urllib.error, random, string

API = 'https://dotlive-api.onrender.com'

def post(path, body, token=None):
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{API}{path}", data=json.dumps(body).encode(),
        headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"__error__": e.code, "__body__": e.read().decode()}

def get(path, token=None):
    headers = {}
    if token: headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API}{path}", headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"__error__": e.code, "__body__": e.read().decode()}

# 1. Founder login
print("=== FOUNDER ===")
fr = post("/api/auth/login", {"email": "browserverify@test.com", "password": "Verify123!"})
if "__error__" in fr: print(f"Login failed: {fr}"); raise SystemExit(1)
founder_token = fr["token"]
founder_id = fr["user"]["id"]
print(f"Founder id: {founder_id}")
print(f"Founder wallet: {get('/api/wallet', founder_token)}")

# 2. Set pricing
fr = post("/api/users/me/founder-profile", {
    "ventureName": "DOT Test Venture",
    "industry": "FinTech",
    "country": "Nigeria",
    "sharePriceKobo": 1500,
    "sharesAvailable": 1000,
    "foundedYear": 2024,
    "bio": "Test venture for Buy Shares.",
    "stage": "Fund",
}, founder_token)
print(f"Set founder profile: {fr}")

# 3. Create investor
print("\n=== INVESTOR ===")
rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
investor_email = f"investor_{rand}@test.com"
sr = post("/api/auth/signup", {"email": investor_email, "password": "TestPass123!", "name": f"Investor {rand}"})
if "__error__" in sr: print(f"Signup failed: {sr}"); raise SystemExit(1)
investor_token = sr["token"]
print(f"Investor: {investor_email}")
print(f"Investor wallet: {get('/api/wallet', investor_token)}")

# 4. Try buying 1 share (1 DOT) — likely fails with insufficient balance
print("\n=== BUY ATTEMPT ===")
br = post("/api/investments", {"founderId": founder_id, "shares": 1}, investor_token)
print(f"Buy: {json.dumps(br, indent=2)}")

# 5. Check portfolio
print("\n=== PORTFOLIO ===")
print(json.dumps(get("/api/investments/mine", investor_token), indent=2))