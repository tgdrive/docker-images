# Extended Caddy

**Caddy Built with different Modules**

- [forwardproxy](https://github.com/caddyserver/forwardproxy)

- [caddy-webdav](https://github.com/mholt/caddy-webdav)

- [caddy-l4](https://github.com/mholt/caddy-l4)

- [cloudflare-dns](https://github.com/caddy-dns/cloudflare)

- [varc](https://github.com/tgdrive/varc)

The image uses the standard Caddy builder. Override the Caddy version when needed:

```sh
docker build \
  --build-arg CADDY_VERSION=latest \
  ./caddy
```

```sh
docker pull ghcr.io/tgdrive/caddy
```
