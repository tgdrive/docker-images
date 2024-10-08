FROM alpine:3.16.2 as builder

RUN apk update
RUN apk add make g++ python3 gnupg curl file flex patch rsync texinfo

ARG arch=
ENV BUILD_ARCH=$arch

COPY build.sh /

RUN curl -Lsq -o musl-cross-make.zip https://git.zv.io/toolchains/musl-cross-make/-/archive/ed72f5171e3d4a9e92026823cbfe93e795105763/musl-cross-make-ed72f5171e3d4a9e92026823cbfe93e795105763.zip \
    && unzip -q musl-cross-make.zip \
    && mv musl-cross-make-ed72f5171e3d4a9e92026823cbfe93e795105763 musl-cross-make \
    && $(/build.sh config_mak ${BUILD_ARCH:-""} /musl-cross-make/config.mak) \
    && cd /musl-cross-make \
    && make install -j$(getconf _NPROCESSORS_ONLN) V= \
    && rm -rf /musl-cross-make

ARG version=0.0.0
ENV NODE_VERSION=$version

# gpg keys listed at https://github.com/nodejs/node#release-keys
RUN for key in \
      4ED778F539E3634C779C87C6D7062848A1AB005C \
      141F07595B7B3FFE74309A937405533BE57C7D57 \
      74F12602B6F1C4E913FAA37AD3A89613643B6201 \
      DD792F5973C6DE52C432CBDAC77ABFA00DDBF2B7 \
      CC68F5A3106FF448322E48ED27F5E38D5B0A215F \
      8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
      C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
      890C08DB8579162FEE0DF9DB8BEAB4DFCF555EF4 \
      C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
      108F52B48DB57BB0CC439B2997B01419BD92F80A \
      A363A499291CBBC940DD62E41F10027AF002F8B0 \
    ; do \
      gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" || \
      gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" ; \
    done \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION.tar.xz" \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION.tar.xz\$" SHASUMS256.txt | sha256sum -c -

ADD patch.sh /
ADD patches /patches

RUN tar -xf "node-v$NODE_VERSION.tar.xz" \
    && cd "node-v$NODE_VERSION" \
    && /patch.sh ${BUILD_ARCH} ${NODE_VERSION} \
    && export TARGET=$(/build.sh target ${BUILD_ARCH:-""}) \
    && export CC=$TARGET-gcc \
    && export CXX=$TARGET-g++ \
    && export AR=$TARGET-ar \
    && export NM=$TARGET-nm \
    && export RANLIB=$TARGET-ranlib \
    && export LINK=$TARGET-g++ \
    && export CXXFLAGS="-O3 -ffunction-sections -fdata-sections" \
    && export LDFLAGS="-Wl,--gc-sections,--strip-all $(/build.sh ld_flags ${BUILD_ARCH:-""})" \
    && ln -snf libc.so /usr/local/$TARGET/lib/ld-musl-*.so.1 \
    && ln -snf /usr/local/$TARGET/lib/ld-musl-*.so.1 /lib \
    && ./configure \
        --partly-static \
        --with-intl=small-icu \
        --without-inspector \
        $(/build.sh node_config ${BUILD_ARCH:-""}) \
    && make -j$(getconf _NPROCESSORS_ONLN) V=

RUN echo 'node:x:1000:1000:Linux User,,,:/home/node:/bin/sh' > /tmp/passwd

FROM scratch

ARG version=0.0.0

LABEL org.opencontainers.image.source="https://github.com/astefanutti/scratch-node"

COPY --from=builder node-v$version/out/Release/node /bin/node
COPY --from=builder /lib/ld-musl-*.so.1 /lib/
COPY --from=builder /tmp/passwd /etc/passwd

USER node

ENTRYPOINT ["node"]
