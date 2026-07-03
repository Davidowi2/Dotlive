"""
Page walk audit. Visit every internal route as a logged-in operator,
collect: HTTP errors, console errors, page errors, and any 404s.
Outputs Pass/Fail per page.
"""
import sys, json
from playwright.sync_api import sync_playwright

EMAIL = "browserverify@test.com"
PASSWORD = "Verify123!"
BASE = "https://dotlive.cv"

# Every page reachable from the sidebar in the operator role.
PAGES = [
    "/dashboard", "/discover", "/search", "/meetings", "/notifications", "/settings", "/help",
    "/vantage", "/wallet", "/referrals", "/leaderboard", "/builder-arena", "/work",
    "/academy", "/sessions", "/pitchathons", "/certificates",
    "/community", "/demo", "/my-venture", "/investor", "/portfolio",
    "/capital-partner", "/admin",
]

results = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context()
    page = ctx.new_page()

    # Capture errors per page
    errs = {"js": [], "net": [], "console": []}
    page.on("pageerror", lambda e: errs["js"].append(str(e)))
    page.on("console", lambda m: m.type in ("error", "warning") and errs["console"].append(f"{m.type}: {m.text}"))
    page.on("requestfailed", lambda r: errs["net"].append(f"{r.url} :: {r.failure}"))
    page.on("response", lambda r: r.status >= 400 and errs["net"].append(f"{r.status} {r.url}"))

    # Login
    page.goto(f"{BASE}/auth?mode=signin", wait_until="networkidle")
    page.fill('input[type="email"]', EMAIL)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url(f"{BASE}/dashboard", timeout=10000)
    print("✅ Signed in", file=sys.stderr)

    for path in PAGES:
        errs_before = {k: len(v) for k, v in errs.items()}
        try:
            page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            # let async fetches finish
            page.wait_for_timeout(800)
        except Exception as e:
            results.append({"path": path, "status": "EXCEPTION", "err": str(e)[:200]})
            continue
        new_errs = {k: errs[k][errs_before[k]:] for k in errs}
        results.append({
            "path": path,
            "status": "ok" if not any(new_errs.values()) else "errs",
            "url": page.url,
            "title": page.title(),
            "js_errors": new_errs["js"],
            "net_errors": new_errs["net"][:5],
            "console": new_errs["console"][:3],
        })

    browser.close()

# Report
print(f"\n{'='*80}\nWalked {len(results)} pages\n{'='*80}")
for r in results:
    flag = "✅" if r.get("status") == "ok" else "❌"
    print(f"\n{flag} {r['path']}  ({r.get('url', '')})")
    if r.get("title"): print(f"   title: {r['title']}")
    for e in r.get("js_errors", []):
        print(f"   [JS]  {e[:300]}")
    for e in r.get("net_errors", []):
        print(f"   [NET] {e[:200]}")
    for e in r.get("console", []):
        print(f"   [CON] {e[:200]}")

# Summary
ok = sum(1 for r in results if r.get("status") == "ok")
print(f"\n{'='*80}\nSUMMARY: {ok}/{len(results)} pages clean\n{'='*80}")
sys.exit(0 if ok == len(results) else 1)
