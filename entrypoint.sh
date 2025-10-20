#!/usr/bin/env bash
set -e

echo "[entrypoint] Running migrations..."
node dist/scripts/run-migrations.js

echo "[entrypoint] Waiting 2 seconds..."
sleep 2

echo "[entrypoint] Running seeds..."
node dist/scripts/seed.js

echo "[entrypoint] Starting app..."
node dist/main.js