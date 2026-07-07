"""Verify Vouch primitive: sign in, go to /profile, check vouches section."""
from playwright.sync_api import sync_playwright

URL = "http://localhost:8081"
EMAIL = "browserverify@test.com"
PASSWORD = "Verify123!"


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context()
        page = ctx.new_page()

        page.on("pageerror", lambda e: errors.append(("pageerror", str(e))))
        page.on(
            "console",
            lambda msg: errors.append(("console-" + msg.type, msg.text))
            if msg.type in ("error", "warning")
            else None,
        )

        # 1. Sign in
        page.goto(URL + "/auth?mode=signin", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(4000)
        page.fill('input#si-email', EMAIL)
        page.fill('input#si-password', PASSWORD)
        page.locator('button:has-text("Sign in")').first.click()
        page.wait_for_url("**/dashboard", timeout=30000)

        # 2. Navigate to profile
        page.goto(URL + "/profile", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(5000)
        page.screenshot(path="C:\\Users\\GTHub\\AppData\\Local\\Temp\\profile-vouches.png", full_page=True)
        print("[ok] /profile loaded")

        # 3. Look for vouch-related content
        content = page.text_content("body") or ""
        if "Vouched by" in content:
            print("[ok] 'Vouched by' section present")
        if "Vouches" in content:
            print("[ok] 'Vouches' stat present")
        if "No vouches yet" in content:
            print("[ok] empty state shown (expected — no vouches in DB yet)")
        if "Build credibility" in content:
            print("[ok] empty state copy present")

        # 4. Dump errors
        print("\n=== CONSOLE/PAGE ERRORS ===")
        if not errors:
            print("(none)")
        for kind, msg in errors:
            # Ignore 404s on the new /api/vouches endpoint — expected since
            # backend not deployed yet.
            if "vouches" in msg.lower() and "404" in msg:
                print(f"[info] {kind}: {msg[:200]}  (expected: backend not deployed)")
            else:
                print(f"[{kind}] {msg[:300]}")

        browser.close()


if __name__ == "__main__":
    main()
