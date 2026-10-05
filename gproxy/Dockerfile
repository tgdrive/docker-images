# syntax=docker/dockerfile:1
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
RUN <<'EOF'
git apply - <<'PATCH'
diff --git a/crates/gproxy-protocol/src/wire/openai/responses/input.rs b/crates/gproxy-protocol/src/wire/openai/responses/input.rs
--- a/crates/gproxy-protocol/src/wire/openai/responses/input.rs
+++ b/crates/gproxy-protocol/src/wire/openai/responses/input.rs
@@ -124,6 +124,7 @@ pub struct ResponseInputText {
 pub struct ResponseInputImage {
     #[serde(rename = "type")]
     pub type_: ResponseInputImageType,
+    #[serde(default = "default_image_detail")]
     pub detail: ImageDetail,
     #[serde(
         default,
@@ -147,6 +148,10 @@ pub struct ResponseInputImage {
     pub rest: Rest,
 }
 
+fn default_image_detail() -> ImageDetail {
+    ImageDetail::Auto
+}
+
 #[derive(
     Debug, Clone, PartialEq, Eq, Serialize, Deserialize, gproxy_protocol_macros::WireBuilder,
 )]
PATCH
EOF
COPY --from=console /source/console/dist/ crates/gproxy-host-axum/assets/web/
ENV RUSTFLAGS="-C target-feature=+crt-static"
RUN native_target="$(rustc -vV | sed -n 's/^host: //p')" \
    && cargo build --locked --release --package gproxy --bin gproxy \
         --features postgres --target "$native_target" \
    && cp "target/$native_target/release/gproxy" /workspace/gproxy

FROM alpine:latest

RUN apk add --no-cache ca-certificates \
    && adduser -S -D -H -u 1000 -h /var/lib/gproxy -G users gproxy \
    && mkdir -p /var/lib/gproxy \
    && chown gproxy:users /var/lib/gproxy

COPY --from=builder /workspace/gproxy /usr/local/bin/gproxy

USER gproxy
EXPOSE 8787
ENV GPROXY_HOST=0.0.0.0 \
    GPROXY_PORT=8787 \
    GPROXY_DATA_DIR=/var/lib/gproxy \
    GPROXY_PERSISTENCE=postgres
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/local/bin/gproxy"]
