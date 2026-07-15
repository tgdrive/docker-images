FROM docker.io/library/golang:1.26-alpine AS vips-build

ARG VIPS_VERSION=8.18.4
ARG LIBEXIF_VERSION=0.6.26
ARG TIFF_VERSION=4.7.2

RUN apk add --no-cache \
    build-base curl xz meson ninja cmake pkgconf file \
    glib-dev glib-static libffi-dev \
    pcre2-dev pcre2-static gettext-dev gettext-static \
    expat-dev expat-static util-linux-static zlib-static \
    libeconf-dev libeconf-static \
    libjpeg-turbo-dev libjpeg-turbo-static \
    libpng-dev libpng-static \
    libwebp-dev libwebp-static \
    libdeflate-dev libdeflate-static zstd-dev zstd-static xz-dev xz-static \
    lcms2-dev lcms2-static cgif-dev

WORKDIR /tmp

RUN curl -L --fail --silent --show-error \
      "https://github.com/libexif/libexif/releases/download/v${LIBEXIF_VERSION}/libexif-${LIBEXIF_VERSION}.tar.xz" \
      | tar -xJ \
 && cd "libexif-${LIBEXIF_VERSION}" \
 && ./configure --prefix=/opt/deps --disable-shared --enable-static \
 && make -j"$(nproc)" \
 && make install

RUN curl -L --fail --silent --show-error \
      "https://download.osgeo.org/libtiff/tiff-${TIFF_VERSION}.tar.xz" \
      | tar -xJ \
 && cmake -S "tiff-${TIFF_VERSION}" -B "tiff-${TIFF_VERSION}/build" \
      -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_INSTALL_PREFIX=/opt/deps \
      -DBUILD_SHARED_LIBS=OFF \
      -Dlzma=OFF -Dzstd=OFF -Dlibdeflate=OFF -Dwebp=OFF \
      -Dtiff-tools=OFF -Dtiff-tests=OFF -Dtiff-contrib=OFF -Dtiff-docs=OFF \
 && cmake --build "tiff-${TIFF_VERSION}/build" -j"$(nproc)" \
 && cmake --install "tiff-${TIFF_VERSION}/build"

ENV PKG_CONFIG_PATH=/opt/deps/lib/pkgconfig:/opt/deps/lib64/pkgconfig:/usr/lib/pkgconfig

RUN curl -L --fail --silent --show-error \
      "https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.xz" \
      | tar -xJ \
 && cd "vips-${VIPS_VERSION}" \
 && meson setup build \
      --buildtype=release \
      --default-library=static \
      --prefix=/opt/vips \
      -Ddeprecated=false -Dexamples=false -Dcplusplus=false \
      -Dmodules=disabled -Dintrospection=disabled \
      -Djpeg=enabled -Dpng=enabled -Dwebp=enabled -Dtiff=enabled \
      -Dlcms=enabled -Dexif=enabled -Dcgif=enabled -Dnsgif=true -Dzlib=enabled \
      -Dcfitsio=disabled -Dfftw=disabled -Dfontconfig=disabled \
      -Darchive=disabled -Dheif=disabled -Dimagequant=disabled \
      -Djpeg-xl=disabled -Dmagick=disabled -Dmatio=disabled -Dnifti=disabled \
      -Dopenexr=disabled -Dopenjpeg=disabled -Dopenslide=disabled \
      -Dhighway=disabled -Dorc=disabled -Dpangocairo=disabled \
      -Dpdfium=disabled -Dpoppler=disabled -Dquantizr=disabled \
      -Drsvg=disabled -Dspng=disabled \
      -Dppm=false -Danalyze=false -Dradiance=false \
 && meson compile -C build \
 && meson install -C build

FROM vips-build AS caddy-build

ARG CADDY_VERSION=latest

ENV PKG_CONFIG_PATH=/opt/vips/lib/pkgconfig:/opt/deps/lib/pkgconfig:/opt/deps/lib64/pkgconfig:/usr/lib/pkgconfig
ENV PKG_CONFIG=/usr/local/bin/pkg-config-static
ENV CGO_ENABLED=1

RUN printf '#!/bin/sh\nexec pkg-config --static "$@"\n' > /usr/local/bin/pkg-config-static \
 && chmod +x /usr/local/bin/pkg-config-static \
 && apk add --no-cache git \
 && go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest \
 && XCADDY_GO_BUILD_FLAGS="-trimpath -tags 'nobadger,nomysql,nopgx,vips' -ldflags '-w -s -linkmode external -extldflags \"-static -leconf\"'" \
    xcaddy build "${CADDY_VERSION}" --output /usr/bin/caddy \
      --with github.com/caddyserver/forwardproxy \
      --with github.com/mholt/caddy-webdav \
      --with github.com/caddy-dns/cloudflare \
      --with github.com/tailscale/caddy-tailscale \
      --with github.com/mholt/caddy-l4 \
      --with github.com/tgdrive/varc \
      --with github.com/tgdrive/caddy-vips

FROM docker.io/library/caddy:alpine

COPY --from=caddy-build /usr/bin/caddy /usr/bin/caddy
