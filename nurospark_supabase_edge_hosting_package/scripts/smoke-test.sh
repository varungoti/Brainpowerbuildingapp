#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-}"; ANON_KEY="${2:-}"
if [ -z "$BASE_URL" ] || [ -z "$ANON_KEY" ]; then echo "Usage: bash scripts/smoke-test.sh https://PROJECT_REF.supabase.co ANON_KEY"; exit 1; fi
curl -fsS "$BASE_URL/functions/v1/portal" > /tmp/nurospark_portal.html
grep -q "NuroSpark Market OS" /tmp/nurospark_portal.html
curl -fsS "$BASE_URL/functions/v1/crm/leads" -H "apikey: $ANON_KEY"
curl -fsS "$BASE_URL/functions/v1/ai-growth/content" -H "apikey: $ANON_KEY" -H "content-type: application/json" -d '{"type":"Instagram Caption"}'
curl -fsS "$BASE_URL/functions/v1/social-os/providers" -H "apikey: $ANON_KEY"
echo "Smoke tests passed."
