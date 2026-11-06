#!/bin/sh

set -e

php /var/www/artisan migrate --force

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
    php /var/www/artisan db:seed --force
fi

exec "$@"
