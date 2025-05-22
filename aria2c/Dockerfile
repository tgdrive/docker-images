FROM alpine

RUN apk add --no-cache bash curl jq findutils grep aria2 ca-certificates tzdata && update-ca-certificates

WORKDIR /app

COPY --from=ghcr.io/tgdrive/rclone /usr/local/bin/rclone /usr/bin/rclone

COPY scripts/ /app/scripts/

RUN mkdir -p /app/downloads

ENV ARIA2_CONF_DIR=/app/scripts
ENV ARIA2_DOWNLOAD_DIR=/app/downloads
ENV XDG_CONFIG_HOME=/config

RUN chmod +x /app/scripts/*.sh
