#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)

set -a
. "$project_root/infrastructure/.env"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:$BACKEND_PORT}"
export VITE_API_BASE_URL
set +a

cd "$project_root/frontend"
exec npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
