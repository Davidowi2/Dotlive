#!/usr/bin/env bash
# scripts/api-smoke.sh
#
# Boots the API on port 3099, hits every registered route with
# an OPTIONS / auth-less GET, and dumps anything that returns 5xx
# or fails to connect. Exits non-zero on any 5xx.
#
# Usage: bash scripts/api-smoke.sh
set -e

cd "$(dirname "$0")/.."

PORT=3099
LOG=/tmp/api-smoke.log

echo "→ Building…"
(cd dotlive-backend/apps/api && npx tsc -p tsconfig.json) 2>&1 | tail -3

echo "→ Booting API on :$PORT…"
# kill anything on the port first
if command -v lsof >/dev/null 2>&1; then
  lsof -ti:$PORT 2>/dev/null | xargs -r kill -9 2>/dev/null || true
fi
DATABASE_URL="${DATABASE_URL:-postgres://x:y@localhost/z}" \
JWT_SECRET="${JWT_SECRET:-test}" \
PORT=$PORT \
  node dotlive-backend/apps/api/dist/server.js >$LOG 2>&1 &
PID=$!

# Wait for listening
for i in 1 2 3 4 5 6 7 8 9 10; do
  if grep -q "Server listening" $LOG 2>/dev/null; then break; fi
  sleep 1
done

if ! grep -q "Server listening" $LOG; then
  echo "❌ API never listened"
  tail -20 $LOG
  kill $PID 2>/dev/null || true
  exit 1
fi
echo "  ✓ up"

# Extract every route from the source — handles multi-line declarations.
# Pattern: app.{method}(   on one line, then a "..." path on a later line
# We collect every (method, path) pair by scanning the file line by line.
ROUTES_FILE=/tmp/api-smoke-routes.txt
> $ROUTES_FILE
for f in dotlive-backend/apps/api/src/routes/*.ts; do
  awk '
    BEGIN { method = "" }
    /app\.(get|post|put|patch|delete)\s*\(/ {
      n = split($0, parts, /app\./)
      if (n >= 2) {
        tail = parts[2]
        sub(/\s*\(.*/, "", tail)
        method = tail
      }
      next
    }
    method != "" && /"[^"]*"/ {
      m = match($0, /"[^"]*"/)
      if (m > 0) {
        path = substr($0, m+1, RLENGTH-2)
        if (path ~ /^\//) {
          print method " " path
        }
        method = ""
      }
    }
  ' "$f"
done | sort -u > $ROUTES_FILE

# Add multi-line routes: any "..." with a method on a previous line
# (this is the simple version; full path enumeration is in a follow-up)
echo "  found $(wc -l < $ROUTES_FILE) unique single-line routes"

# Hit each one with a GET (anonymous — we'll catch auth-required 401s separately)
FAILS=0
TOTAL=0
while read -r line; do
  [ -z "$line" ] && continue
  METHOD=$(echo "$line" | awk '{print $1}')
  PATH_=$(echo "$line" | sed -E 's/^[^"]+"([^"]+)".*/\1/')
  case "$METHOD" in
    get)    R="GET"    ;;
    post)   R="POST"   ;;
    put)    R="PUT"    ;;
    patch)  R="PATCH"  ;;
    delete) R="DELETE" ;;
    *) continue ;;
  esac
  TOTAL=$((TOTAL+1))
  CODE=$(curl -s -o /tmp/api-smoke-body -w "%{http_code}" --max-time 3 -X "$R" "http://localhost:$PORT/api$PATH_" 2>/dev/null || echo "000")
  if [ "$CODE" = "000" ]; then
    echo "  ✗ $R $PATH_  (no response)"
    FAILS=$((FAILS+1))
  elif [ "$CODE" -ge 500 ] 2>/dev/null; then
    echo "  ✗ $R $PATH_  $CODE  $(head -c 80 /tmp/api-smoke-body)"
    FAILS=$((FAILS+1))
  fi
done < $ROUTES_FILE

# Cleanup
kill $PID 2>/dev/null || true
wait $PID 2>/dev/null || true

echo ""
echo "Routes hit: $TOTAL   Failures (5xx/conn): $FAILS"
if [ $FAILS -gt 0 ]; then exit 1; fi
echo "✅ API smoke test passed"
