#!/bin/sh

set -e

php /var/www/artisan migrate --force

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
    php /var/www/artisan db:seed --force
else
    php /var/www/artisan db:seed --class=RoleSeeder --force
    php /var/www/artisan db:seed --class=AdminSeeder --force
    php /var/www/artisan db:seed --class=ClientSeeder --force
fi

exec "$@"
