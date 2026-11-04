#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)

set -a
. "$project_root/infrastructure/.env"
APP_URL="http://127.0.0.1:$BACKEND_PORT"
FRONTEND_URL="http://127.0.0.1:$FRONTEND_PORT"
SANCTUM_STATEFUL_DOMAINS="127.0.0.1:$FRONTEND_PORT"
export APP_URL FRONTEND_URL SANCTUM_STATEFUL_DOMAINS
set +a

cd "$project_root/backend"
php artisan config:clear --no-interaction >/dev/null
exec php artisan serve --no-reload --host 127.0.0.1 --port "$BACKEND_PORT"
