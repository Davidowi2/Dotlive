#!/usr/bin/env bash
# scripts/boot-test.sh
#
# Boot smoke test: build then start the API for 4 seconds and grep for
# Fastify duplicate-route errors. Exits non-zero if the server fails to
# come up clean. Run as part of CI or after every backend change.
#
# Usage:   cd dotlive-backend/apps/api && bash ../../scripts/boot-test.sh
set -e

cd "$(dirname "$0")/../dotlive-backend/apps/api"

echo "→ Building…"
npx tsc -p tsconfig.json

echo "→ Boot test (4s)…"
DATABASE_URL="${DATABASE_URL:-postgres://x:y@localhost/z}" \
JWT_SECRET="${JWT_SECRET:-test}" \
  timeout 4 node dist/server.js 2>&1 | tee /tmp/boot.log >/dev/null

if grep -qE "FST_ERR_DUPLICATED_ROUTE" /tmp/boot.log; then
  echo ""
  echo "❌ DUPLICATE ROUTE DETECTED"
  grep -E "Method '|for route '|FST_ERR" /tmp/boot.log
  exit 1
fi

if ! grep -q "Server listening" /tmp/boot.log; then
  echo ""
  echo "❌ SERVER FAILED TO LISTEN"
  tail -20 /tmp/boot.log
  exit 1
fi

echo ""
echo "✅ Boot test passed — all routes unique, server listening."
