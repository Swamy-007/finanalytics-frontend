#!/bin/sh
# Write runtime env vars so the SPA can read them from window.__ENV__
cat <<EOF > /usr/share/nginx/html/config.js
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_UPLOAD_URL: "${VITE_UPLOAD_URL}",
  VITE_ENV: "${VITE_ENV}"
};
EOF

exec nginx -g "daemon off;"
