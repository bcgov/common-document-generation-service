# Common Document Generation Service [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) [![img](https://img.shields.io/badge/Lifecycle-Stable-97ca00)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

![Tests](https://github.com/bcgov/common-document-generation-service/workflows/Tests/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/b360d0b4c9ad56149499/maintainability)](https://codeclimate.com/github/bcgov/common-document-generation-service/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/b360d0b4c9ad56149499/test_coverage)](https://codeclimate.com/github/bcgov/common-document-generation-service/test_coverage)

[![version](https://img.shields.io/docker/v/bcgovimages/common-document-generation-service.svg?sort=semver)](https://hub.docker.com/r/bcgovimages/common-document-generation-service)
[![pulls](https://img.shields.io/docker/pulls/bcgovimages/common-document-generation-service.svg)](https://hub.docker.com/r/bcgovimages/common-document-generation-service)
[![size](https://img.shields.io/docker/image-size/bcgovimages/common-document-generation-service.svg)](https://hub.docker.com/r/bcgovimages/common-document-generation-service)

CDOGS - A common hosted service (API) for generating documents from templates, data documents, and assets

To learn more about the **Common Services** available visit the [Common Services Showcase](https://bcgov.github.io/common-service-showcase/) page.

## Table of Contents

- [OpenAPI Specification](#openapi-specification)
- [Environment Variables](#environment-variables)
  - [Carbone Variables](#carbone-variables)
  - [Keycloak Variables](#keycloak-variables)
  - [Server Variables](#server-variables)
- [Quick Start](#quick-start)
  - [Docker](#docker)
  - [Local Machine](#local-machine)
- [License](#license)

## OpenAPI Specification

This API is defined and described in OpenAPI 3.0 specification.

When the API is running, you should be able to view the specification through ReDoc at <http://localhost:3000/api/v2/docs> (assuming you are running this microservice locally).

The hosted CDOGS API can usually be found at <https://cdogs.nrs.gov.bc.ca/api/v2/docs>.

For more details on using CDOGS and its underlying Carbone library, take a look at the [Usage guide](/app/USAGE.md).

## Environment Variables

CDOGS behavior is highly customizable through Environment Variables. The following will provide you with the main settings that you should be aware of. However, the complete list of supported variables can be found under [/app/config/custom-environment-variables.json](config/custom-environment-variables.json). Reference the [NPM Config](https://www.npmjs.com/package/config) library for more details on how configuration is cascaded and managed.

### Carbone Variables

The following variables alter the behavior of Carbone and its caching behavior.

| Config Var | Env Var | Default | Notes |
| --- | --- | --- | --- |
| `cacheDir` | `CACHE_DIR` | `/tmp/carbone-files` | This is the root location to read/write files. Error will be thrown if directory does not exist and cannot be created. Will attempt to fall back to operating system temp file location. |
| `cacheSize` | `CACHE_SIZE` | `2GB` | The maximum size of the `cacheDir` directory. Oldest timestamped files will be cycled out to make room for new files. Uses the [bytes](https://www.npmjs.com/package/bytes) library for parsing values. |
| `converterFactoryTimeout` | `CONVERTER_FACTORY_TIMEOUT` | `60000` | Maximum amount of time (in milliseconds) that Carbone will use to convert files before timing out. |
| `formFieldName` | `UPLOAD_FIELD_NAME` | `template` | Field name for multipart form data upload when uploading templates via /template api. |
| `startCarbone` | `START_CARBONE` | `true` | If true, then the carbone converter will be started on application start. This will ensure that the first call to /render will not incur the overhead of starting the converter. |
| `uploadCount` | `UPLOAD_FILE_COUNT` | `1` | Limit the number of files uploaded per call.  Default is 1; not recommended to use any other value. |
| `uploadSize` | `UPLOAD_FILE_SIZE` | `25MB` | Limit size of template files. Uses the [bytes](https://www.npmjs.com/package/bytes) library for parsing values. |

### Keycloak Variables

The following variables alter CDOGS authentication behavior. By default, if `KC_ENABLED` is left unset/undefined, CDOGS will run in unauthenticated mode, ignoring the rest of the Keycloak environment variables. Should you want CDOGS to require authentication, you will need to set `KC_ENABLED` to `true`.

| Config Var | Env Var | Default | Notes |
| --- | --- | --- | --- |
| `clientId` | `KC_CLIENTID` |  | Keycloak client id for CDOGS |
| `clientSecret` | `KC_CLIENTSECRET` |  | Keycloak client secret for CDOGS |
| `enabled` | `KC_ENABLED` |  | Whether to run CDOGS in unauthenticated or Keycloak protected mode |
| `publicKey` | `KC_PUBLICKEY` | | If specified, verify all incoming JWT signatures off of the provided public key |
| `realm` | `KC_REALM` | `jbd6rnxw` | Keycloak realm for CDOGS |
| `serverUrl` | `KC_SERVERURL` | `https://dev.oidc.gov.bc.ca/auth` | Keycloak server url for CDOGS authentication |

### Server Variables

The following variables alter the general Express application behavior. For most situations, the defaults should be sufficient.

| Config Var | Env Var | Default | Notes |
| --- | --- | --- | --- |
| `bodyLimit` | `SERVER_BODYLIMIT` | `100mb` | Maximum request body length that CDOGS will accept |
| `logFile` | `SERVER_LOGFILE` | | If defined, will attempt to write log output to |
| `logLevel` | `SERVER_LOGLEVEL` | `info` | The log level/verbosity to report at |
| `morganFormat` | `SERVER_MORGANFORMAT` | `dev` | The morgan format to log http level requests in. Options: `dev` and `combined` |
| `port` | `SERVER_PORT` | `3000` | The port that CDOGS application will bind to |

## Quick Start

The following sections provide you a quick way to get CDOGS set up and running.

### Docker

This section assumes you have a recent version of Docker available to work with on your environment. Make sure to have an understanding of what environment variables are passed into the application before proceeding.

Get CDOGS image (change latest tag to specific version if needed):

```sh
docker pull bcgovimages/common-document-generation-service:latest
```

Run CDOGS in unauthenticated mode

```sh
docker run -it --rm -p 3000:3000 bcgovimages/common-document-generation-service:latest
```

Run CDOGS in Keycloak protected mode (replace environment values as necessary)

```sh
docker run -it --rm -p 3000:3000 -e KC_CLIENTID=<id> -e KC_CLIENTSECRET=<secret> -e KC_ENABLED=true -e KC_PUBLICKEY=<publickey> -e KC_REALM=<realm> -e KC_SERVERURL=<url> bcgovimages/common-document-generation-service:latest
```

For more dedicated deployments of CDOGS in a Docker environment, make sure to consider using persistent volumes for the cache directories.

### Local Machine

This section assumes you have a recent version of Node.js (12.x or higher) and LibreOffice™ (6.3.4.x or higher) installed. Make sure to have an understanding of what environment variables are passed into the application before proceeding.

#### Configuration

Configuration management is done using the [config](https://www.npmjs.com/package/config) library. There are two ways to configure:

1. Look at [custom-environment-variables.json](/app/config/custom-environment-variables.json) and ensure you have the environment variables locally set. Create a `local.json` file in the config folder. This file should never be added to source control. Consider creating a `local-test.json` file in the config folder if you want to use different configurations while running unit tests.
2. Look at [custom-environment-variables.json](/app/config/custom-environment-variables.json) and use explicit environment variables in your environment as mentioned [above](#environment-variables) to configure your application behavior.

For more details, please consult the config library [documentation](https://github.com/lorenwest/node-config/wiki/Configuration-Files).

#### Common Commands

Install node dependencies with either `npm ci` or `npm install`.

Run the server with hot-reloading for development

``` sh
npm run serve
```

Run the server without hot-reloading

``` sh
npm run start
```

Run your tests

``` sh
npm run test
```

Lint the codebase

``` sh
npm run lint
```

## License

```txt
Copyright 2019 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
