#!/bin/sh

php /var/www/artisan migrate --force

exec "$@"