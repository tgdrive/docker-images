FROM docker.io/library/caddy:builder-alpine AS caddy-build

ARG CADDY_VERSION=latest

RUN XCADDY_GO_BUILD_FLAGS="-trimpath -tags 'nobadger,nomysql,nopgx' -ldflags '-w -s'" \
    xcaddy build "${CADDY_VERSION}" --output /usr/bin/caddy \
      --with github.com/caddyserver/forwardproxy \
      --with github.com/mholt/caddy-webdav \
      --with github.com/caddy-dns/cloudflare \
      --with github.com/mholt/caddy-l4 \
      --with github.com/tgdrive/varc/caddy@main \
      --replace github.com/tgdrive/varc=github.com/tgdrive/varc@main

FROM docker.io/library/caddy:alpine

COPY --from=caddy-build /usr/bin/caddy /usr/bin/caddy
