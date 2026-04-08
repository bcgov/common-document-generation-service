#!/bin/bash
set -e

error_handler() {
    echo "Error occurred in line $1"
    exit 1
}

# Set error handler
trap 'error_handler $LINENO' ERR

# Convenience workspace directory for later use
WORKSPACE_DIR=$(pwd)
CDOGS_LOCAL_DIR=${WORKSPACE_DIR}/.devcontainer/cdogs_local
# Note: Global npm packages (jest, eslint, etc.) are installed in the devcontainer Dockerfile

# Ensure we're in the workspace root
cd ${WORKSPACE_DIR}
echo "Working directory: $(pwd)"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed or not in PATH. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Docker Compose is not installed or not in PATH. Please install Docker Compose and try again."
    exit 1
fi

# Check if required directories exist
if [ ! -d "app" ]; then
    echo "Error: 'app' directory not found. Please ensure you're running this script from the workspace root."
    exit 1
fi

# Check if the license exists
if [ ! -f "${CDOGS_LOCAL_DIR}/carbone-license.txt" ]; then
    echo "Error: Carbone license file not found in ${CDOGS_LOCAL_DIR}. Please add your carbone-license.txt file and try again."
    exit 1
fi

(cd app && npm install)
APP_PID=$!

wait $APP_PID

# Check if any installations failed
if [ $? -ne 0 ]; then
    echo "Error: npm install failed in app directory."
    exit 1
fi

echo "All dependencies installed successfully."

# copy over the sample files to the image
if [ ! -f "${CDOGS_LOCAL_DIR}/local.json" ]; then
    cp ${CDOGS_LOCAL_DIR}/sample.local.json ${CDOGS_LOCAL_DIR}/local.json
fi
