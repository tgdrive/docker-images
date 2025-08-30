FROM caddy:builder-alpine AS builder

RUN xcaddy build \
   --with github.com/caddyserver/forwardproxy \
   --with github.com/mholt/caddy-webdav \
   --with github.com/caddy-dns/cloudflare \
   --with github.com/tailscale/caddy-tailscale \
   --with github.com/mholt/caddy-l4
FROM caddy:alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
