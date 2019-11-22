# Common Hosted Document Service on Openshift

This application is deployed on Openshift. This readme will outline how to setup and configure an Openshift project to get the application to a deployable state. There are also some historical notes on how to bootstrap from nothing to fully deployed on Openshift. This document assumes a working knowledge of Kubernetes/Openshift container orchestration concepts (i.e. buildconfigs, deployconfigs, imagestreams, secrets, configmaps, routes, etc)

Our builds and deployments are orchestrated with Jenkins as part of the devops tools ecosystem (see [nr-showcase-devops-tools](https://github.com/bcgov/nr-showcase-devops-tools)). Refer to [Jenkinsfile](../Jenkinsfile) and [Jenkinsfile.cicd](../Jenkinsfile.cicd) to see how the Openshift templates are used for building and deploying in our CI/CD pipeline.

## Environment Setup - ConfigMaps and Secrets

There are some requirements in the target Openshift namespace/project which are **outside** of the CI/CD pipeline process. This application requires that a few Secrets as well as Config Maps be already present in the environment before it is able to function as intended. Otherwise the Jenkins pipeline will fail the deployment by design.

In order to prepare an environment, you will need to ensure that all of the following configmaps and secrets are populated. This is achieved by executing the following commands as a project administrator of the targeted environment. Note that this must be repeated on *each* of the target deployment namespace/projects (i.e. `dev`, `test` and `prod`) as that they are independent of each other. Deployment will fail otherwise. Refer to [custom-environment-variables](../app/config/custom-environment-variables.json) for the direct mapping of environment variables for the backend.

### Config Maps
TBD

### Secrets

Replace anything in angle brackets with the appropriate value!

_Note: Publickey if used must be a PEM-encoded value encapsulated in double quotes in the argument. Newlines should not be re-encoded when using this command. If authentication fails, it's very likely a newline whitespace issue._

```sh
oc create -n idcqvl-<env> secret generic cdogs-keycloak-secret \
  --type=kubernetes.io/basic-auth \
  --from-literal=username=<username> \
  --from-literal=password=<password>
```

## Build Config & Deployment

This application is a Node.js standalone microservice. We are currently leveraging basic Openshift Routes to expose and foward incoming traffic to the right pods.

### Application

The application is a standard [Node](https://nodejs.org)/[Express](https://expressjs.com) server. It handles the JWT based authentication via OIDC authentication flow, and exposes the API to authorized users. This deployment container is built up using an Openshift S2I image strategy. The resulting container after build is what is deployed.

## Templates

The Jenkins pipeline heavily leverages Openshift Templates in order to ensure that all of the environment variables, settings, and contexts are pushed to Openshift correctly. Files ending with `.bc.yaml` specify the build configurations, while files ending with `.dc.yaml` specify the components required for deployment.

### Build Configurations
TBD

### Deployment Configurations
TBD

## Pull Request Cleanup
TBD
