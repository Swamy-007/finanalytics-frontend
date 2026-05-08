#!/bin/sh
# Replace $PORT placeholder in nginx config at runtime

#!/bin/sh
cat <<EOF > /usr/share/nginx/html/config.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_UPLOAD_URL: "${VITE_UPLOAD_URL}",
  VITE_ENV: "${VITE_ENV}"
};
EOF

sed -i "s/\$PORT/${PORT:-3003}/g" /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"