# Dev Container Setup for Common Document Generation Service (CDOGS)

This dev container provides a fully configured development environment for the Common Document Generation Service (CDOGS), a Node.js application that uses Carbone Enterprise Edition for document templating and generation.

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
- [Docker](https://www.docker.com/get-started) installed and running on your host machine
- A valid Carbone Enterprise Edition license key

## Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd common-document-generation-service
   ```

2. **Obtain Carbone License**
   - Place your Carbone Enterprise Edition license key in a file named `carbone-license.txt`
   - Save this file in the `.devcontainer/cdogs_local/` directory

3. **Open in VS Code**
   - Open the cloned repository in Visual Studio Code
   - When prompted, click "Reopen in Container" or use Command Palette: `Dev Containers: Reopen in Container`

4. **Wait for Setup**
   - The dev container will build automatically (this may take several minutes on first run)
   - The post-install script will install Node.js dependencies and configure the environment

## What's Included

This dev container provides:

- **Node.js 20.18.3** with npm for running the CDOGS application
- **LibreOffice** with full font support for document processing
- **Microsoft Core Fonts** and BC Sans fonts for consistent document rendering
- **k6** load testing tool for performance testing
- **Docker-in-Docker** support for running containerized services
- **Git** for version control
- **ESLint** and **Prettier** extensions for code quality
- Pre-configured ports:
  - `3000`: CDOGS application server
  - `4000`: Carbone Enterprise Edition service

## Running the Application

Once the dev container is ready:

1. **Start Carbone Service** (if not auto-started):

   ```bash
   cd .devcontainer/cdogs_local
   docker-compose up -d carbone
   ```

2. **Start CDOGS Application**:

   ```bash
   cd app
   npm start
   ```

3. **Access the Application**:
   - Open http://localhost:3000 in your browser for the CDOGS API
   - Carbone service runs on http://localhost:4000

## Development Workflow

- **Code Editing**: Use VS Code with ESLint and Prettier for automatic formatting
- **Testing**: Run unit tests with `npm test` in the `app` directory
- **Load Testing**: Use k6 scripts in the `k6` directory for performance testing
- **API Documentation**: View OpenAPI specs in `app/src/docs/v2.api-spec.yaml`

## Configuration

- Local configuration is managed in `.devcontainer/cdogs_local/local.json`
- Environment variables are set via `NODE_CONFIG_DIR` pointing to the local config directory
- Docker volumes are mounted for template and render directories

## Troubleshooting

- **Build Issues**: Ensure Docker is running and you have sufficient disk space
- **License Errors**: Verify `carbone-license.txt` contains a valid Carbone EE license
- **Port Conflicts**: Check that ports 3000 and 4000 are available on your host
- **Permission Issues**: The post-install script sets executable permissions on shell scripts

## Additional Resources

- [CDOGS Main README](../README.md)
- [Carbone Documentation](https://carbone.io/documentation.html)
- [k6 Documentation](https://k6.io/docs/)
- [Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
