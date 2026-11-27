# MCP Camoufox on Bun

Builds the maintained [tgdrive/mcp-camoufox](https://github.com/tgdrive/mcp-camoufox)
fork pinned to `d61d049802df0146da2f263b0690012bc80b24b8`. There are no Docker-only source patches.
The image name remains `ghcr.io/tgdrive/camofox-browser`.

```sh
docker build --build-arg TARGETARCH=arm64 \
  --build-arg CAMOFOX_REVISION=<published-full-fork-commit-sha> \
  -f camofox/Dockerfile -t mcp-camoufox:test .
```

The fork commit must contain its Bun lockfile and production changes. Release
builds use the pinned fork revision by default; override the workflow input
`fork-revision` to test another published fork commit. There is no upstream fallback.

Camoufox **159.0-beta.43** and the GeoIP database (`2026.11.25`) are downloaded
at image build time. Startup checks require both bundled assets. Bundled mode
rejects a missing browser rather than downloading it at runtime.

The runtime uses Bun, Xvfb and Openbox. The X11 socket directory is pre-created
as root with mode 1777; desktop caches use the writable home cache, not the
browser installation directory.

The fork exposes authenticated REST `/v1` and HTTP MCP `/mcp`, with private
Bun IPC between isolated browser workers. See the fork's
[production API documentation](https://github.com/tgdrive/mcp-camoufox/blob/main/docs/PRODUCTION.md)
for session handling and cookie results. This is not the jo-inc REST API.

The publishing workflow checks native input geometry, HTTP authentication,
MCP over HTTP, actual browser navigation and the native HTTP client before
pushing the new image. Local site-specific tests are not repository fixtures.
