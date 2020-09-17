# Common Hosted Document Service on Openshift

This application is deployed on Openshift. This readme will outline how to setup and configure an Openshift project to get the application to a deployable state. There are also some historical notes on how to bootstrap from nothing to fully deployed on Openshift. This document assumes a working knowledge of Kubernetes/Openshift container orchestration concepts (i.e. buildconfigs, deployconfigs, imagestreams, secrets, configmaps, routes, etc)

Our builds and deployments are orchestrated with Jenkins as part of the devops tools ecosystem (see [nr-showcase-devops-tools](https://github.com/bcgov/nr-showcase-devops-tools)). Refer to [Jenkinsfile](../Jenkinsfile) and [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the Openshift templates are used for building and deploying in our CI/CD pipeline.

## Environment Setup - ConfigMaps and Secrets

There are some requirements in the target Openshift namespace/project which are **outside** of the CI/CD pipeline process. This application requires that a few Secrets as well as Config Maps be already present in the environment before it is able to function as intended. Otherwise the Jenkins pipeline will fail the deployment by design.

In order to prepare an environment, you will need to ensure that all of the following configmaps and secrets are populated. This is achieved by executing the following commands as a project administrator of the targeted environment. Note that this must be repeated on *each* of the target deployment namespace/projects (i.e. `dev`, `test` and `prod`) as that they are independent of each other. Deployment will fail otherwise. Refer to [custom-environment-variables](../app/config/custom-environment-variables.json) for the direct mapping of environment variables for the backend.

### Config Maps

*Note: Replace anything in angle brackets with the appropriate value!*

```sh
oc create -n idcqvl-<env> configmap cdogs-keycloak-config \
  --from-literal=KC_REALM=jbd6rnxw \
  --from-literal=KC_SERVERURL=https://sso-dev.pathfinder.gov.bc.ca/auth
```

*Note: Change KC_SERVERURL's sso-dev to sso-test or sso depending on the environment!*

```sh
oc create -n idcqvl-<env> configmap cdogs-server-config \
  --from-literal=SERVER_ATTACHMENTLIMIT=20mb \
  --from-literal=SERVER_BODYLIMIT=100mb \
  --from-literal=SERVER_LOGLEVEL=info \
  --from-literal=SERVER_MORGANFORMAT=combined \
  --from-literal=SERVER_PORT=3000
```

### Secrets

Replace anything in angle brackets with the appropriate value!

```sh
oc create -n idcqvl-<env> secret generic cdogs-keycloak-secret \
  --type=kubernetes.io/basic-auth \
  --from-literal=username=<username> \
  --from-literal=password=<password>
```

```sh
oc create -n idcqvl-<env> secret generic cdogs-common-service-secret \
  --type=kubernetes.io/basic-auth \
  --from-literal=username=<cdogs common service client id> \
  --from-literal=password=<cdogs common service client password>
```

## Build Config & Deployment

This application is a Node.js standalone microservice. We are currently leveraging basic Openshift Routes to expose and foward incoming traffic to the right pods.

### Application

The application is a standard [Node](https://nodejs.org)/[Express](https://expressjs.com) server. It handles the JWT based authentication via OIDC authentication flow, and exposes the API to authorized users. This deployment container is built up using a custom Dockerfile strategy. The resulting container after build is what is deployed.

## Templates

The Jenkins pipeline heavily leverages Openshift Templates in order to ensure that all of the environment variables, settings, and contexts are pushed to Openshift correctly. Files ending with `.bc.yaml` specify the build configurations, while files ending with `.dc.yaml` specify the components required for deployment.

### Build Configurations

Build configurations will emit and handle the chained builds or standard builds as necessary. They take in the following parameters:

| Name | Required | Description |
| --- | --- | --- |
| REPO_NAME | yes | Application repository name |
| JOB_NAME | yes | Job identifier (i.e. 'pr-5' OR 'master') |
| SOURCE_REPO_REF | yes | Git Pull Request Reference (i.e. 'pull/CHANGE_ID/head') |
| SOURCE_REPO_URL | yes | Git Repository URL |

The template can be manually invoked and deployed via Openshift CLI. For example:

```sh
oc -n idcqvl-<env> process -f openshift/app.bc.yaml -p REPO_NAME=common-document-generation-service
 -p JOB_NAME=master -p SOURCE_REPO_URL=https://github.com/bcgov/common-document-generation-service.git -p SOURCE_REPO_REF=master -o yaml | oc -n idcqvl-<env> create -f -
```

Note that these build configurations do not have any triggers defined. They will be invoked by the Jenkins pipeline, started manually in the console, or by an equivalent oc command for example:

```sh
oc -n idcqvl-<env> start-build <buildname> --follow
```

Finally, we generally tag the resultant image so that the deployment config will know which exact image to use. This is also handled by the Jenkins pipeline. The equivalent oc command for example is:

```sh
oc -n idcqvl-<env> tag <buildname>:latest <buildname>:master
```

*Note: Remember to swap out the bracketed values with the appropriate values!*

#### Docker Strategy Background

LibreOffice and its custom Python environment must be included as part of the container image in order for the application to support Carbone PDF conversion functionality. To achieve this, we elected to build and extend off of the widely used `mhart/alpine-node` image which contains the bare essentials for a Node application to run. The Alpine distribution of LibreOffice, Python, and supporting packages are then installed onto the base image.

Since the PDF conversion functionality depends on custom Python packages provided by LibreOffice, we need to apply a wrapper script around Python to ensure these packages are picked up. These things can be found under the `app/docker` directory. This is applied onto the image before we proceed with the standard npm installation process. Some background information can be found at this issue [here](https://github.com/Ideolys/carbone/issues/46).

### Deployment Configurations

Deployment configurations will emit and handle the deployment lifecycles of running containers based off of the previously built images. They generally contain a deploymentconfig, a service, and a route. They take in the following parameters:

| Name | Required | Description |
| --- | --- | --- |
| REPO_NAME | yes | Application repository name |
| JOB_NAME | yes | Job identifier (i.e. 'pr-5' OR 'master') |
| NAMESPACE | yes | which namespace/"environment" are we deploying to? dev, test, prod? |
| APP_NAME | yes | short name for the application |
| HOST_ROUTE | yes | used to set the publicly accessible url |

The Jenkins pipeline will handle deployment invocation automatically. However should you need to run it manually, you can do so with the following for example:

```sh
oc -n idcqvl-<env> process -f openshift/app.dc.yaml -p REPO_NAME=common-document-generation-service -p JOB_NAME=master -p NAMESPACE=idcqvl-<env> -p APP_NAME=cdogs -p HOST_ROUTE=cdogs-master-idcqvl-<env>.pathfinder.gov.bc.ca -o yaml | oc -n idcqvl-<env> apply -f -
```

Due to the triggers that are set in the deploymentconfig, the deployment will begin automatically. However, you can deploy manually by use the following command for example:

```sh
oc -n idcqvl-<env> rollout latest dc/<buildname>-master
```

*Note: Remember to swap out the bracketed values with the appropriate values!*

## Sidecar Logging

As of October 2020, we are using a Fluent-bit sidecar to collect logs from the CDOGS application. The sidecar deployment is included in the main app.dc.yaml file.
Additional steps for configuring the sidecar can be seen on the [wiki](https://github.com/bcgov/nr-get-token/wiki/Logging-to-a-Sidecar).

## Pull Request Cleanup

As of this time, we do not automatically clean up resources generated by a Pull Request once it has been accepted and merged in. This is still a manual process. Our PR deployments are all named in the format "pr-###", where the ### is the number of the specific PR. In order to clear all resources for a specific PR, run the following two commands to delete all relevant resources from the Openshift project (replacing `PRNUMBER` with the appropriate number):

```sh
oc delete all,pvc -n idcqvl-dev --selector app=cdogs-pr-<PRNUMBER>

```
