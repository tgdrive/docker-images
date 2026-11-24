# Build from this repository root. The maintained fork requires a pinned revision.
FROM docker.io/oven/bun:1 AS bun

FROM docker.io/library/debian:trixie-slim AS browser
ARG TARGETARCH
ARG CAMOUFOX_VERSION=159.0
ARG CAMOUFOX_RELEASE=beta.43
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*
# Versions are overridable without editing architecture-specific hashes.
RUN set -eu; \
    case "$TARGETARCH" in \
      amd64) arch=x86_64 ;; \
      arm64) arch=arm64 ;; \
      *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    curl --fail --location --retry 3 -o /tmp/browser.zip \
      "https://github.com/daijro/camoufox/releases/download/v${CAMOUFOX_VERSION}-${CAMOUFOX_RELEASE}/camoufox-${CAMOUFOX_VERSION}-${CAMOUFOX_RELEASE}-lin.${arch}.zip"; \
    mkdir -p /opt/camoufox-cache/camoufox; \
    status=0; unzip -q /tmp/browser.zip -d /opt/camoufox-cache/camoufox || status=$?; \
    test "$status" -le 1; \
    test -x /opt/camoufox-cache/camoufox/camoufox-bin; \
    printf '{"version":"%s","release":"%s"}\n' "$CAMOUFOX_VERSION" "$CAMOUFOX_RELEASE" \
      > /opt/camoufox-cache/camoufox/version.json; \
    chmod -R a+rX /opt/camoufox-cache
# Upstream enables GeoIP by default. Bundle its database too: a first-run
# downloader would otherwise write progress to the MCP stdout channel.
ARG GEOIP_RELEASE=2026.11.25
RUN curl --fail --location --retry 3 -o /opt/camoufox-cache/camoufox/GeoLite2-City.mmdb \
    "https://github.com/P3TERX/GeoLite.mmdb/releases/download/${GEOIP_RELEASE}/GeoLite2-City.mmdb"

FROM docker.io/library/debian:trixie-slim AS dependencies
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
ARG CAMOFOX_REVISION=d61d049802df0146da2f263b0690012bc80b24b8
WORKDIR /app
RUN test -n "$CAMOFOX_REVISION" \
    && apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl --fail --location --retry 3 -o /tmp/upstream.tar.gz \
       "https://github.com/tgdrive/mcp-camoufox/archive/${CAMOFOX_REVISION}.tar.gz" \
    && tar -xzf /tmp/upstream.tar.gz --strip-components=1 -C /app
RUN bun install --frozen-lockfile --ignore-scripts \
    && bun run build \
    && bun pm cache rm

FROM docker.io/library/debian:trixie-slim AS production-dependencies
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY --from=dependencies /app/package.json /app/bun.lock ./
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && bun install --production --frozen-lockfile --ignore-scripts \
    && bun pm cache rm

FROM docker.io/library/debian:trixie-slim
ARG CAMOFOX_REVISION=d61d049802df0146da2f263b0690012bc80b24b8
ARG CAMOUFOX_VERSION=159.0
ARG CAMOUFOX_RELEASE=beta.43
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
LABEL org.opencontainers.image.source="https://github.com/tgdrive/docker-images" \
    org.opencontainers.image.revision="${CAMOFOX_REVISION}" \
    io.tgdrive.mcp-camoufox.source="https://github.com/tgdrive/mcp-camoufox" \
    io.tgdrive.camoufox.version="${CAMOUFOX_VERSION}-${CAMOUFOX_RELEASE}"
ENV NODE_ENV=production \
    HOME=/home/camofox \
    XDG_CACHE_HOME=/home/camofox/.cache \
    CAMOUFOX_INSTALL_DIR=/opt/camoufox-cache/camoufox \
    MCP_CAMOUFOX_BUNDLED=1 \
    DISPLAY=:99
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-0 libdbus-glib-1-2 libxt6 libasound2 libx11-xcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxi6 libxrandr2 \
    libxrender1 libxss1 libxtst6 libegl1 libgl1-mesa-dri libgbm1 \
    xvfb openbox xdotool x11-utils x11-xserver-utils procps \
    fonts-liberation fonts-noto-color-emoji fontconfig ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=browser --chown=1000:1000 /opt/camoufox-cache /opt/camoufox-cache
WORKDIR /app
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./
COPY --from=dependencies /app/dist ./dist
COPY camofox/entrypoint.ts camofox/smoke.ts camofox/input-geometry.test.ts ./
RUN useradd --uid 1000 --create-home --shell /usr/sbin/nologin camofox \
    && mkdir -p /home/camofox/.cache /home/camofox/.camoufox-mcp \
    && install -d -m 1777 -o root -g root /tmp/.X11-unix \
    && ln -s /opt/camoufox-cache/camoufox /home/camofox/.cache/camoufox \
    && chown -R camofox:camofox /home/camofox
USER camofox
ENTRYPOINT ["bun", "/app/entrypoint.ts"]
