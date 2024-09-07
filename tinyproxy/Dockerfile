# Dockerfile.build
FROM alpine:latest as build

RUN apk add --no-cache build-base autoconf automake libtool git ca-certificates

RUN git clone https://github.com/tinyproxy/tinyproxy.git

WORKDIR /tinyproxy

RUN ./autogen.sh && \
    ./configure --sysconfdir=/etc --enable-transparent --enable-upstream \
    --enable-reverse --enable-filter --enable-silent-rules LDFLAGS="-static" && make
RUN printf 'Port 3128' > tinyproxy.conf

FROM scratch
COPY --from=build /tinyproxy/src/tinyproxy /tinyproxy
COPY --from=build /etc/ssl/certs /etc/ssl/certs
COPY --from=build /tinyproxy/tinyproxy.conf /etc/tinyproxy/tinyproxy.conf

ENTRYPOINT ["/tinyproxy", "-d"]

