#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)

set -a
. "$project_root/infrastructure/.env"
set +a

output_file="/tmp/osminog-local-auth-cors-$$.log"

cleanup() {
  status=$?
  kill "$backend_pid" 2>/dev/null || true
  cd "$project_root/backend"
  php artisan config:clear --no-interaction >/dev/null
  return "$status"
}

cd "$project_root/backend"
php artisan config:cache --no-interaction >/dev/null
"$project_root/infrastructure/scripts/run-backend.sh" >"$output_file" 2>&1 &
backend_pid=$!
trap cleanup EXIT INT TERM

attempt=0
until curl -fsS "http://127.0.0.1:$BACKEND_PORT/up" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 25 ]; then
    sed -n '1,80p' "$output_file"
    exit 1
  fi
  sleep 0.2
done

headers=$(curl -fsS -D - -o /dev/null \
  -X OPTIONS \
  -H "Origin: http://127.0.0.1:$FRONTEND_PORT" \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type,X-XSRF-TOKEN' \
  "http://127.0.0.1:$BACKEND_PORT/auth/login")

printf '%s' "$headers" | grep -Fqi "Access-Control-Allow-Origin: http://127.0.0.1:$FRONTEND_PORT"
printf '%s' "$headers" | grep -Fqi 'Access-Control-Allow-Credentials: true'
printf '%s' "$headers" | grep -Fqi 'Access-Control-Allow-Methods: POST'
