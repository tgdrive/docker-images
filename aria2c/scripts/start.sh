#!/usr/bin/env bash

$ARIA2_CONF_DIR/update_tracker.sh "$ARIA2_CONF_DIR/aria2.conf"

echo "Trackers Updated"

aria2c --conf-path="$ARIA2_CONF_DIR/aria2.conf" --rpc-secret="${RPC_SECRET}" --dir="${ARIA2_DOWNLOAD_DIR}"