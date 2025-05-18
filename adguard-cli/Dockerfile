FROM alpine

RUN apk update && \
    apk add --no-cache curl ca-certificates && \
    rm -rf /var/cache/apk/*

RUN curl -fsSL https://raw.githubusercontent.com/AdguardTeam/AdGuardCLI/release/install.sh | \
    sed 's#read -r response < /dev/tty#response=y#' | sh -s -- -v

RUN adguard-cli --help

CMD ["adguard-cli"]