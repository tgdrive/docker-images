FROM debian:latest as build

ARG USERNAME=user
ARG USER_UID=1000
ARG USER_GID=1000
ARG BUILD_VERSION=10.0.0
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    cmake \
    ninja-build \
    pkg-config \
    gcc \
    g++ \
    zlib1g-dev \
    libssl-dev \
    libpcre3-dev \
    libpcre2-dev \
    libcap-dev \
    libhwloc-dev \
    libncurses5-dev \
    git

RUN git clone https://github.com/apache/trafficserver.git -b ${BUILD_VERSION} /trafficserver

WORKDIR /trafficserver

RUN groupadd --gid ${USER_GID} ${USERNAME} \
    && useradd --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME} \
    && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

RUN cmake -B build -DWITH_USER=user -DCMAKE_INSTALL_PREFIX=/ats -DCMAKE_BUILD_TYPE=Release -DBUILD_EXPERIMENTAL_PLUGINS=ON

RUN cmake --build build -j $(nproc)

RUN cmake --install build

FROM debian:bookworm-slim

ARG USERNAME=user
ARG USER_UID=1000
ARG USER_GID=1000

USER root

RUN groupadd --gid ${USER_GID} ${USERNAME} \
    && useradd --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME} \
    && echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

COPY --from=build /ats /ats

RUN chown -R ${USER_UID}:${USER_GID} /ats

RUN apt-get update && apt-get install -y \
    libssl-dev \
    libpcre3 \
    libhwloc15 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

USER user

ENTRYPOINT ["/ats/bin/traffic_server","start"]