#!/bin/sh
# Replace $PORT placeholder in nginx config at runtime
sed -i "s/\$PORT/${PORT:-3003}/g" /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"