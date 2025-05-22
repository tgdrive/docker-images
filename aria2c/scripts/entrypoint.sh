#!/bin/sh

set -e

chown -R ${PUID}:${PGID} /app/downloads

chown -R ${PUID}:${PGID} /app/session

exec aria2c --dir=/app/downloads "$@"