# Node.js Static  Docker Images

Multi-architecture distroless Node.js Docker images.

## Content

* The Node.js binary, statically linked using [_musl_](https://musl.libc.org), with opt-in support for i18n data
* The _musl_ dynamic linker, to support native modules
* A `/etc/passwd` entry for a `node` user

## Images

Multi-architecture images for `amd64` and  `arm64`
* Tags: `latest`, `lts`

## Usage

```dockerfile
FROM node as builder

WORKDIR /app

COPY package.json package-lock.json index.js ./

RUN npm install --prod

FROM ghcr.io/tgdrive/node

COPY --from=builder /app /

ENTRYPOINT ["node", "index.js"]
```

### Native modules

Native modules need to be statically compiled with _musl_ to be loadable.
This can easily be achieved by updating the above example with:

```dockerfile
FROM node:alpine as builder

RUN apk update && apk add make g++ python

WORKDIR /app

COPY package.json package-lock.json index.js ./

RUN LDFLAGS='-static-libgcc -static-libstdc++' npm install --build-from-source=<native_module>

FROM ghcr.io/tgdrive/node

COPY --from=builder /app /

ENTRYPOINT ["node", "index.js"]
```

### Internationalization

The Node binaries are linked against the ICU library statically, and include a subset of ICU data (typically only the English locale) to keep the image sizes small.
Additional locales data can be provided if needed, so that methods work for all ICU locales.
It can be made available to ICU by retrieving the locales data from the ICU sources, e.g.:

```dockerfile
FROM alpine as builder

RUN apk update && apk add curl

# Note the exact version of icu4c that's compatible depends on the Node version!
RUN curl -Lsq -o icu4c-71_1-src.zip https://github.com/unicode-org/icu/releases/download/release-71-1/icu4c-71_1-src.zip \
    && unzip -q icu4c-71_1-src.zip

FROM ghcr.io/tgdrive/node

COPY --from=builder /icu/source/data/in/icudt71l.dat /icu/

ENV NODE_ICU_DATA=/icu
```

More information can be found in the [Providing ICU data at runtime](https://nodejs.org/api/intl.html#intl_providing_icu_data_at_runtime) from the Node.js documentation.