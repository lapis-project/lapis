# setup-dev-env.sh
#!/bin/bash

# This script sets a development environment for the lapis project with functioning database
# and backend server based on the pulled code

# Install the dependencies
docker build -t lapis-dev-backend:latest -f ./Dockerfile_Backend .
docker compose up -d

# Run the script to build the types
pnpm run start:devSetup
