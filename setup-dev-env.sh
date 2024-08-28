# setup-dev-env.sh
#!/bin/bash

# This script sets a development environment for the lapis project with functioning database
# and backend server based on the pulled code

# Check if pnpm exists on the machine
if ! [ -x "$(command -v pnpm)" ]; then
		echo "pnpm could not be found, please install pnpm before running this script"
		echo "for example with corepack enable or npm install -g pnpm"
		exit 1
fi

# Install the dependencies
pnpm install

# Build the docker images and run the containers
docker build -t lapis-dev-backend:latest -f ./Dockerfile_Backend .
docker compose --env-file .env.localsetup up -d

# Run the script to build the types
pnpm run start:devSetup
