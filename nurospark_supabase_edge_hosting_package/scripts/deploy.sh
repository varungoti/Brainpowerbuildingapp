#!/usr/bin/env bash
set -euo pipefail
PROJECT_REF="${1:-}"
if [ -z "$PROJECT_REF" ]; then echo "Usage: bash scripts/deploy.sh YOUR_PROJECT_REF"; exit 1; fi
supabase link --project-ref "$PROJECT_REF"
supabase db push
supabase functions deploy --project-ref "$PROJECT_REF"
echo "Portal: https://$PROJECT_REF.supabase.co/functions/v1/portal"
