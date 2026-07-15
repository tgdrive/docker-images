# Extended Caddy

**Caddy Built with different Modules**

- [forwardproxy](https://github.com/caddyserver/forwardproxy)

- [caddy-webdav](https://github.com/mholt/caddy-webdav)

- [caddy-l4](https://github.com/mholt/caddy-l4)

- [cloudflare-dns](https://github.com/caddy-dns/cloudflare)

- [caddy-tailscale](https://github.com/tailscale/caddy-tailscale)

- [varc](https://github.com/tgdrive/varc), built with its optional libvips image transformation support

The image is built directly from static libvips and its required native dependencies in an isolated builder stage. The final Caddy binary is linked fully statically. Override the source versions when needed:

```sh
docker build \
  --build-arg VIPS_VERSION=8.18.4 \
  --build-arg LIBEXIF_VERSION=0.6.26 \
  --build-arg TIFF_VERSION=4.7.2 \
  ./caddy
```

```sh
docker pull ghcr.io/tgdrive/caddy
```