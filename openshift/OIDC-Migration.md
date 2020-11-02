# SSO-OIDC Migration

This document outlines the precise steps and actions that are to be taken during and after the transition to using *.oidc.gov.bc.ca as the Keycloak domain.

## Strategy

As our core services (CDOGS, CHES) are the only ones affected by the SSO-OIDC transition, this document will apply to both of them. Both of these services are considered highly available, with numerous clients depending on them. As previously investigated, we are unable to swap the configmap to use the new oidc endpoint without breaking access for our clients, so we need to provide a transition where both styles of authentication (sso and oidc) are available.

Our migration strategy will have two phases. Phase 1 will be where we temporarily support two parallel deployments of the service in order to allow users to migrate on their own schedule. Phase 2 will align with the sunsetting of the sso endpoint, where we will also sunset the old endpoint, and consolidate back to only one deployment.

### Phase 1

Our main strategy during this period is to create a manual, parallel deploymenet of our service. This parallel deployment will accept traffic with OIDC JWTs, while we continue to support the original SSO JWTs in the original deployment. At bare minimum, we will require a parallel config map, route, service and deployment config created. A big note with these parallel resources:

1. The deployment config shall reuse as much existing infrastructure as feasibly possible. This means that it will attempt to use the same PVCs, DBs, and other supporting resources as the other service as to minimize unnecessary divergences such as split-braining.
2. Openshift route paths are read-only after creation. This means that we are unable to on-the-fly change a path to listen to a different URL. To get around this, we will instead create another parallel route path with the intended changes. We will adopt and consolidate this new route instance in Phase 2.

#### Phase 1 Templates

There will be four manifests that we will need to be duplicated with minor tweaks. For convention, we will be appending `-oidc` to these resources instead of `-master`.

* Route - This route will use the nomenclature of `<service>-<env>.<cluster-domain>`, or `<service>.<cluster-domain>` for prod.
* Service - The service will simply expose the parallelized deployment configuration in the cluster.
* Config Map - We will create a temporary config map copy of the manifest where it has the keycloak server url.
* Deployment Config - This template will be copied from the original, but with certain fields hard-coded to have `-oidc` instead of the dynamically defined one (usually ends up as `-master`). Care shall be taken to ensure that no more divergence than is absolutely necessary is done. The service will use the same image as the main master deployment, but leverage the alternative config map instead.

#### Phase 1 Pipeline

No changes to the Jenkins pipeline will need to be done at this time, as all the actions with the templates above can be manually created.

### Phase 2

Once SSO begins to sunset, we will no longer need to maintain our parallel infrastructure. Most of the temporary constructs can be decomissioned at this point. General order of operations is to change the original SSO service to be OIDC (and reboot), and then remove the templates that are no longer needed after.

#### Phase 2 Templates

These are the template changes needed in order to properly consolidate back to only one deployment:

* Route - We will be decomissioning the original master route object. The newer oidc route will change its service target definition to point to the original service.
* Service - We will be decomissioning the parallel service. The original service will be used, and no changes are required.
* Config Map - the original configmap with the keycloak server url will be redefined to use the OIDC endpoint instead of the SSO endpoint (reboot the pods to have it take effect). The temporary one can be removed when no longer needed by the parallel deployment config.
* The parallel deployment config will be decomissioned. The original deployment config will have no changes.

#### Phase 2 Pipeline

The only change to the pipeline will be the template name for the Route object. The route object will have the `-oidc` suffix hard-coded instead of using the original dynamically defined one. We are doing this because this is the path of least resistance in order to preserve maximal service availability. Expect a PR for this at a later date.
