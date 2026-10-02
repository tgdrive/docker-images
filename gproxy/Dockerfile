FROM node:lts-trixie-slim AS console

WORKDIR /source/console
RUN corepack enable
COPY console/package.json console/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY console/ ./
RUN pnpm build

FROM rust:1-trixie AS builder

WORKDIR /source
RUN apt-get update \
    && apt-get install -y --no-install-recommends clang cmake libclang-dev \
    && rm -rf /var/lib/apt/lists/*
COPY . .
COPY --from=console /source/console/dist/ crates/gproxy-host-axum/assets/web/
RUN cargo build --locked --release --package gproxy --bin gproxy --features postgres

FROM gcr.io/distroless/cc-debian13

WORKDIR /app
COPY --from=builder /source/target/release/gproxy /usr/local/bin/gproxy

USER 65532:65532
EXPOSE 8787
ENV GPROXY_HOST=0.0.0.0 \
    GPROXY_PORT=8787 \
    GPROXY_DATA_DIR=/app/data \
    GPROXY_PERSISTENCE=postgres

ENTRYPOINT ["/usr/local/bin/gproxy"]
