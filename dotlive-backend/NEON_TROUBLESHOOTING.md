# Neon password troubleshooting

If you've ever been frustrated by Neon rejecting your password
mid-session even though the same URL worked five minutes ago —
this doc explains why, and how to avoid it.

## The short version

> **Never bake the Neon password into source code or a checked-in
> file. Always pass it via `DATABASE_URL` in the shell, or in a
> local `.env` file you control.**

## What's actually happening

There are three separate things people call "the Neon password
isn't working", and they have different causes:

### 1. You rotated the password from the Neon dashboard

Every time you click "Reset database password" in the Neon
console, the previous `npg_...` key is invalidated. There is
**no grace period**. The next request using the old password
returns `28P01 password authentication failed for user
'neondb_owner'`.

**Why this caught you out:** the push-schema.mjs script worked
once, then "stopped working" — but in between you'd hit the
dashboard and reset the password. The script had a stale copy.

**Fix:** always copy the URL fresh from the Neon dashboard right
before you push a schema, and set it in your shell:

```bash
export DATABASE_URL="postgresql://neondb_owner:***@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
node apps/api/scripts/push-schema.mjs
```

### 2. The pooler endpoint and the direct endpoint have separate auth paths

Neon gives you two endpoints per database:

- **Pooler** — `ep-xxx-pooler.region.aws.neon.tech:6543` (transaction-mode pooling)
- **Direct** — `ep-xxx.region.aws.neon.tech:5432` (single connection, persistent)

A password reset on the dashboard invalidates the **pooler**
key faster than the **direct** key (sometimes the direct key
still works for a few minutes after a pooler rotation).

**Why this caught you out:** push-schema.mjs using the pooler
URL failed, but the same user with the direct URL succeeded.

**Fix:** the updated `push-schema.mjs` retries the direct
endpoint automatically if the pooler fails. You'll see:

```
[1/5] Connecting to Neon…
  [pooler] password authentication failed for user 'neondb_owner'
  pooler failed — retrying with direct endpoint (no -pooler)
  [direct] connected to neondb
```

### 3. Secret-detection in your dev environment scrubs passwords from files

If you write the password to a `.env` file and that file is
later opened by a tool that re-processes secret-looking strings
(common in AI assistant sandboxes, Hermes desktop, etc.), the
on-disk file can contain `***` instead of the real password,
even though you wrote the real password.

The next `node -e` script that reads `.env` then connects with
the redacted value, and you get `28P01` again.

**Why this caught you out:** the password was correct, the URL
was correct, the database was reachable, but the value on disk
was `***` — silently replaced after your write.

**Fix:** set the URL inline in the shell where it's not at rest:

```bash
DATABASE_URL="postgresql://..." node apps/api/scripts/push-schema.mjs
```

Or, if your shell has a sanitized display, echo-then-check:

```bash
echo "${DATABASE_URL//:*/:PW@}"
# Should print: postgresql://neondb_owner:PW@ep-xxx...
# If it prints 'PW' instead of the real password, the variable
# itself is fine — display is just masked.
```

## Recommended local dev setup

1. Open `apps/api/.env` in a text editor that does NOT
   auto-process secrets (VS Code with the "Secret Detection"
   extension disabled, or just plain Notepad).
2. Paste the URL from the Neon dashboard.
3. `node apps/api/scripts/push-schema.mjs`

If step 3 fails with `28P01`:
- Confirm the password in `.env` is the real one (no `***`).
- Re-copy the URL from the Neon dashboard (a reset may have
  happened since you last opened it).
- Re-run the script.

## What `push-schema.mjs` does now

```
[1/5] Connecting to Neon…
      Tries pooler URL. On 28P01, falls back to direct URL.
[2/5] Counting tables…
      Reports current count so you can see if migrations matter.
[3/5] Applying migrations…
      Drizzle migrator. Idempotent — re-running is safe.
[4/5] Seeding role_requirements defaults…
      Idempotent via ON CONFLICT DO UPDATE.
[5/5] Final state…
      Reports table count and role_requirements rows.
```

If you see "Both pooler and direct endpoints refused auth" —
the password is stale. Go to the Neon dashboard and reset it.

## Production

In production you don't run push-schema.mjs at all. The
migration runs once before the first deploy, and the schema
stays put. Use the same DATABASE_URL env var on Render (set in
the dashboard, not in source) and the Fastify app talks to it
over the pooler endpoint for normal traffic.
