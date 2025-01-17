ARG TARGETARCH
ARG PG_MAJOR=17
ARG PGVECTO_TAG=v0.4.0

FROM tensorchord/pgvecto-rs-binary:pg${PG_MAJOR}-${PGVECTO_TAG}-${TARGETARCH} as binary

FROM groonga/pgroonga:latest-debian-${PG_MAJOR}

COPY --from=binary /pgvecto-rs-binary-release.deb /tmp/vectors.deb

RUN <<EOR
apt-get update
apt-mark hold locales
apt-get install -y --no-install-recommends build-essential postgresql-server-dev-$PG_MAJOR git ca-certificates
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
apt-get install -y /tmp/vectors.deb
rm -f /tmp/vectors.deb
apt-get remove -y build-essential postgresql-server-dev-$PG_MAJOR git
apt-get autoremove -y 
apt-mark unhold locales
rm -rf /var/lib/apt/lists/*
EOR

CMD ["postgres", \
     "-c", "cron.database_name=${POSTGRES_DB:-postgres}", \
     "-c", "shared_preload_libraries=pg_cron,vectors", \
     "-c", "search_path=\"$user\",public,vectors", \
     "-c", "logging_collector=on"]