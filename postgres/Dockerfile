ARG PG_MAJOR=17
ARG VCHORD_TAG=0.4.3

FROM tensorchord/vchord-binary:pg${PG_MAJOR}-v${VCHORD_TAG} AS binary

FROM groonga/pgroonga:latest-debian-${PG_MAJOR}

COPY --from=binary /workspace/ /tmp/

RUN mv /tmp/*.deb /tmp/vchord.deb

RUN <<EOR
apt-get update
apt-mark hold locales
apt-get install -y --no-install-recommends build-essential postgresql-server-dev-${PG_MAJOR} git ca-certificates
mkdir -p build
cd build 
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make OPTFLAGS="" && make install
cd ..
git clone https://github.com/citusdata/pg_cron.git
cd pg_cron
make && make install
cd ..
rm -rf build
apt-get install -y /tmp/vchord.deb
rm -f /tmp/vchord.deb
apt-get remove -y build-essential postgresql-server-dev-${PG_MAJOR} git
apt-get autoremove -y 
apt-mark unhold locales
rm -rf /var/lib/apt/lists/*
EOR

CMD ["postgres", \
     "-c", "cron.database_name=postgres", \
     "-c", "shared_preload_libraries=pg_cron,vchord.so", \
     "-c", "logging_collector=on"]