#!/bin/sh

set -e

echo "Starting custom entrypoint..."

# Initialize the database but don't start postgres
docker-entrypoint.sh postgres -h '' &
PID=$!

# Wait for the initialization to complete
echo "Waiting for PostgreSQL to initialize..."
until pg_isready; do
    sleep 1
done

# Stop the temporary PostgreSQL process
echo "Stopping temporary PostgreSQL process..."
kill -s TERM $PID
wait $PID

# Modify the PostgreSQL configuration if not already done
CONFIG_FILE="/var/lib/postgresql/data/postgresql.conf"
if ! grep -q "shared_preload_libraries = 'pg_cron'" "$CONFIG_FILE"; then
    echo "Modifying PostgreSQL configuration..."
    echo "shared_preload_libraries = 'pg_cron'" >> "$CONFIG_FILE"
fi

if ! grep -q "cron.database_name = '${POSTGRES_DB:-postgres}'" "$CONFIG_FILE"; then
    echo "cron.database_name = '${POSTGRES_DB:-postgres}'" >> "$CONFIG_FILE"
fi

echo "Starting PostgreSQL..."
# Has to run as the postgres user
exec su - postgres -c "postgres -D /var/lib/postgresql/data"
