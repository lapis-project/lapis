#!/bin/bash
# make-migration.sh
set -e

# 1. Validate input
if [ -z "$1" ]; then
  echo "Error: Please provide a migration name (e.g., add_users)."
  exit 1
fi

# 2. Generate timestamp and file path
TIMESTAMP=$(date +%Y%m%d%H%M%S)
FILE_PATH="apps/backend/src/db/migrations/${TIMESTAMP}_$1.sql"

# 3. Ensure directory exists and create the file
mkdir -p "apps/backend/src/db/migrations"
touch "$FILE_PATH"

echo "Created migration: $FILE_PATH"
