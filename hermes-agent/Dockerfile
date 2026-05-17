FROM ghcr.io/tgdrive/curl-impersonate:latest AS curl-impersonate

FROM alpine:latest AS builder

# Disable Python stdout buffering to ensure logs are printed immediately
ENV PYTHONUNBUFFERED=1

# Install packages needed for building — no runtime tools, no editors
RUN apk add --no-cache \
    build-base \
    ca-certificates \
    curl \
    gcc \
    git \
    libffi-dev \
    nodejs \
    npm \
    openssh-client \
    python3 \
    python3-dev \
    uv

# Non-root user for build steps
RUN adduser -D -u 10000 -h /opt/data hermes

WORKDIR /opt/hermes
RUN chown hermes:hermes /opt/hermes

# ---------- Layer-cached dependency install ----------
COPY --chown=hermes:hermes package.json package-lock.json ./
COPY --chown=hermes:hermes web/package.json web/package-lock.json web/
COPY --chown=hermes:hermes ui-tui/package.json ui-tui/package-lock.json ui-tui/
COPY --chown=hermes:hermes ui-tui/packages/hermes-ink/ ui-tui/packages/hermes-ink/

ENV npm_config_install_links=false

USER hermes
RUN npm install --prefer-offline --no-audit && \
    (cd web && npm install --prefer-offline --no-audit) && \
    (cd ui-tui && npm install --prefer-offline --no-audit) && \
    npm cache clean --force

# ---------- Layer-cached Python dependency install ----------
COPY --chown=hermes:hermes pyproject.toml uv.lock ./
RUN touch ./README.md
RUN uv sync --frozen --no-install-project --extra all

# ---------- Source code ----------
COPY --chown=hermes:hermes . .

# Build browser dashboard and terminal UI assets.
# Remove package-lock.json after build so _tui_need_npm_install()
# hits the prebuilt-bundle shortcut (dist/entry.js exists, but no lockfile → skip).
# Build happens BEFORE node_modules cleanup since npm run build needs esbuild.
RUN cd web && npm run build && rm -rf node_modules && rm -f package-lock.json && \
    cd ../ui-tui && npm run build && rm -f package-lock.json && \
    rm -f /opt/hermes/package-lock.json

# Patch main.py to skip esbuild rebuild at runtime when the prebuilt bundle exists.
# The "Always rebuild" codepath crashes without node_modules/esbuild. This check
# mirrors _tui_need_npm_install()'s own prebuilt-bundle shortcut
# (dist/entry.js exists + no package-lock.json → skip both install AND rebuild).
RUN python3 <<'PATCH_EOF'
path = '/opt/hermes/hermes_cli/main.py'
with open(path) as f:
    code = f.read()

old = """            sys.exit(1)

    if tui_dev:"""

new = """            sys.exit(1)

    # Prebuilt bundle (Docker layout): dist/entry.js exists, no lockfile
    # → skip esbuild rebuild entirely, run the prebuilt bundle directly.
    entry = tui_dir / "dist" / "entry.js"
    lock = tui_dir / "package-lock.json"
    if entry.is_file() and not lock.is_file():
        node = _node_bin("node")
        return [node, str(entry)], tui_dir

    if tui_dev:"""

assert old in code, "Failed to find insertion point in main.py"
code = code.replace(old, new)

with open(path, 'w') as f:
    f.write(code)
print("Patched main.py with prebuilt bundle shortcut")
PATCH_EOF

# Now safe to delete all node_modules — patched code never runs npm run build
# in the prebuilt-bundle layout, so no esbuild needed at runtime.
RUN rm -rf ui-tui/node_modules web/node_modules /opt/hermes/node_modules

# Pre-install ALL lazy deps from tools/lazy_deps.py so no runtime pip install is needed
# stt.faster_whisper skipped — ctranslate2 only publishes manylinux (glibc) wheels,
# not compatible with Alpine's musl libc. No wheel, no source build on musl.
COPY tools/lazy_deps.py ./tools/
RUN python3 <<'EOF' > /tmp/lazy-reqs.txt
import sys
sys.path.insert(0, '/opt/hermes/tools')
from lazy_deps import LAZY_DEPS
skip_features = {'stt.faster_whisper'}
specs = set()
for feature, pkgs in LAZY_DEPS.items():
    if feature in skip_features:
        continue
    specs.update(pkgs)
for spec in sorted(specs):
    print(spec)
EOF
RUN uv pip install --no-cache-dir -r /tmp/lazy-reqs.txt

# Link hermes-agent itself (editable)
RUN uv pip install --no-cache-dir --no-deps -e "."



# ---------- Runtime stage ----------
FROM alpine:latest

ENV PYTHONUNBUFFERED=1

# Only runtime-essential packages — no build tools
RUN apk add --no-cache \
    bash \
    ca-certificates \
    libstdc++ \
    coreutils \
    sed \
    docker-cli \
    ffmpeg \
    git \
    github-cli \
    gosu \
    jq \
    less \
    nano \
    nodejs \
    npm \
    openssh-client \
    procps \
    python3 \
    ripgrep \
    shadow \
    tini \
    unzip \
    uv \
    zip

RUN adduser -D -u 10000 -h /opt/data hermes

WORKDIR /opt/hermes

# Install curl-impersonate — a curl that can mimic browser TLS fingerprints.
# Includes wrapper scripts for Chrome, Safari, Firefox, Edge, Tor.
# Symlink curl → latest Chrome version for automatic browser impersonation.
COPY --from=curl-impersonate /usr/local/bin/ /usr/local/bin/
RUN latest_chrome=$(ls /usr/local/bin/curl_chrome* | sort -V | tail -1) && \
    ln -sf "$(basename "$latest_chrome")" /usr/local/bin/curl

COPY --chown=hermes:hermes --from=builder /opt/hermes .

# Make files world-readable for any HERMES_UID override, and .venv/ui-tui
# writable so lazy dep installs work at runtime.
# node_modules is intentionally absent (removed after build).
RUN chmod -R a+rX /opt/hermes && \
    chown -R hermes:hermes /opt/hermes/.venv /opt/hermes/ui-tui

# Start as root so the entrypoint can usermod/groupmod + gosu.
# If HERMES_UID is unset, the entrypoint drops to the default hermes user (10000).
USER root

# ---------- Runtime ----------
ENV HERMES_WEB_DIST=/opt/hermes/hermes_cli/web_dist
ENV HERMES_HOME=/opt/data
ENV PATH="/opt/data/.local/bin:${PATH}"
VOLUME [ "/opt/data" ]
ENTRYPOINT [ "/sbin/tini", "-g", "--", "/opt/hermes/docker/entrypoint.sh" ]
