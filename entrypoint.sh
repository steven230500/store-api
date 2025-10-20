#!/usr/bin/env sh
set -e
# Si usas TypeORM:
# node dist/migrations/run.js || true
# o si tienes script:
# pnpm migrate || true

node dist/main.js