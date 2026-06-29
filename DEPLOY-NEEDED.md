# 🚨 CRITICAL — Site is down, deploys not happening

## What's broken
- Vercel is still serving `index-CF825sIv.js` (a broken bundle)
- My last 5 commits (4deec55, 5027117, b5cacaf, etc.) are on `origin/main` but **Vercel is not rebuilding**
- Client-side hydration crashes with `Cannot read properties of undefined (reading 'mount')`

## Root cause
- `.lovable/project.json` exists in the repo → **Lovable owns the Vercel integration**
- Git pushes don't trigger Vercel deploys — you must trigger from the Lovable UI
- The empty commit + styles.css change I tried didn't force a rebuild either

## What you need to do (URGENT)
1. **Open the Lovable dashboard** at https://lovable.dev
2. Open this project
3. Click the **"Push to GitHub"** or **"Sync"** button (top right)
4. Wait for the deploy to complete (Vercel will pick it up after Lovable syncs)

## What's already done (committed + on origin/main)
| Commit | What | Status |
|---|---|---|
| `4deec55` | Removed dead wizard code from `__root.tsx` | SSR-clean, no hooks leaking |
| `5027117` | PUT `/api/users/me/builder-profile` (was 404) | Tested ✅ |
| `b5cacaf` | Order disputes endpoint + migration | Tested ✅ |
| `26a96e9` | Vercel redeploy marker | Waiting for deploy |

## What you'll see after deploy
- All routes 200
- Notifications working
- Buy Shares flow visible
- Builder profile PUT works
- Order dispute flow works

## Why I can't fix this from my side
- Vercel deploys are managed by Lovable, not by git pushes
- Empty commits, file edits, and force pushes all have the same result — Vercel doesn't see them
- Only Lovable can trigger a Vercel rebuild

**Please click the Lovable "Push" / "Sync" button now. Once you do, the site will be live with all my fixes.**

If you want me to take over deployment configuration, you can disconnect Vercel from Lovable and reconnect it to GitHub directly:
- https://vercel.com/dashboard → Project → Settings → Git → Disconnect from Lovable → Connect to GitHub repo Davidowi2/Dotlive
- After that, every git push will auto-deploy
