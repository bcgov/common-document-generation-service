# Common Document Generation Service [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE) [![img](https://img.shields.io/badge/Lifecycle-Stable-97ca00)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)

![Tests](https://github.com/bcgov/common-document-generation-service/workflows/Tests/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/b360d0b4c9ad56149499/maintainability)](https://codeclimate.com/github/bcgov/common-document-generation-service/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/b360d0b4c9ad56149499/test_coverage)](https://codeclimate.com/github/bcgov/common-document-generation-service/test_coverage)

[![version](https://img.shields.io/docker/v/bcgovimages/common-document-generation-service.svg?sort=semver)](https://hub.docker.com/r/bcgovimages/common-document-generation-service)
[![pulls](https://img.shields.io/docker/pulls/bcgovimages/common-document-generation-service.svg)](https://hub.docker.com/r/bcgovimages/common-document-generation-service)
[![size](https://img.shields.io/docker/image-size/bcgovimages/common-document-generation-service.svg)](https://hub.docker.com/r/bcgovimages/common-document-generation-service)

CDOGS - A common hosted service (API) for generating documents from templates, data documents, and assets

To learn more about the **Common Services** available visit the [Common Services Showcase](https://bcgov.github.io/common-service-showcase/) page.

## Directory Structure

    .github/                   - PR and Issue templates
    app/                       - Application Root
    ├── docker/                - Auxillary support scripts for LibreOffice Python wrapper
    ├── src/                   - Node.js backend web application
    ├── tests/                 - Node.js backend web application tests
    └── Dockerfile             - Docker image specification
    openshift/                 - OpenShift-deployment specific files
    CODE-OF-CONDUCT.md         - Code of Conduct
    COMPLIANCE.yaml            - BCGov PIA/STRA compliance status
    CONTRIBUTING.md            - Contributing Guidelines
    Jenkinsfile                - Top-level Pipeline
    Jenkinsfile.cicd           - Pull-Request Pipeline
    LICENSE                    - License

## Documentation

* [Application Readme](app/README.md)
* [Openshift Readme](openshift/README.md)
* [Devops Tools Setup](https://github.com/bcgov/nr-showcase-devops-tools)
* [Product Roadmap](https://github.com/bcgov/nr-get-token/wiki/Product-Roadmap)

## Getting Help or Reporting an Issue

To report bugs/issues/features requests, please file an issue.

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md) guidelines.

Please note that this project is released with a [Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

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
