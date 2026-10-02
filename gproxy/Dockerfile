FROM public.ecr.aws/docker/library/node:lts-alpine AS console

ARG GPROXY_BUILD_HASH=unknown
WORKDIR /source
COPY Cargo.toml ./
WORKDIR /source/console
RUN corepack enable
COPY console/package.json console/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
WORKDIR /source
COPY . .
WORKDIR /source/console
RUN GPROXY_BUILD_HASH="$GPROXY_BUILD_HASH" pnpm build

# Native musl toolchain from upstream's deploy/container/Dockerfile.musl.
FROM alpine:edge AS builder

RUN apk add --no-cache build-base cargo clang22 clang22-dev cmake git go \
        linux-headers perl pkgconf \
    && ln -s /usr/bin/clang-22 /usr/local/bin/clang

WORKDIR /workspace
COPY . .
COPY --from=console /source/console/dist/ crates/gproxy-host-axum/assets/web/
ENV RUSTFLAGS="-C target-feature=+crt-static"
RUN cargo build --locked --release --package gproxy --bin gproxy --features postgres

FROM alpine:latest

RUN apk add --no-cache ca-certificates \
    && adduser -S -D -H -u 1000 -h /var/lib/gproxy -G users gproxy \
    && mkdir -p /var/lib/gproxy \
    && chown gproxy:users /var/lib/gproxy

COPY --from=builder /workspace/target/release/gproxy /usr/local/bin/gproxy

USER gproxy
EXPOSE 8787
ENV GPROXY_HOST=0.0.0.0 \
    GPROXY_PORT=8787 \
    GPROXY_DATA_DIR=/var/lib/gproxy \
    GPROXY_PERSISTENCE=postgres
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/local/bin/gproxy"]
