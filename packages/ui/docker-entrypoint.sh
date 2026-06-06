#!/bin/sh
set -eu

if [ -z "${AGENT_BACKEND_URL:-}" ]; then
  echo "ERROR: AGENT_BACKEND_URL is not set. Set it to your agent server URL, e.g.:"
  echo "  AGENT_BACKEND_URL=http://pw8wwc0gkc0w880w8w4gscsc.72.62.37.229.sslip.io"
  exit 1
fi

echo "Configuring nginx proxy -> ${AGENT_BACKEND_URL}"
envsubst '${AGENT_BACKEND_URL}' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
