# common-document-generation-service

![Version: 0.0.1](https://img.shields.io/badge/Version-0.0.1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 2.4.2](https://img.shields.io/badge/AppVersion-2.4.2-informational?style=flat-square)

A microservice for merging JSON data into xml-based templates (powered by Carbone.io)

**Homepage:** <https://github.com/bcgov/common-document-generation-service>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| NR Common Service Showcase Team | <NR.CommonServiceShowcase@gov.bc.ca> | <https://bcgov.github.io/common-service-showcase/team.html> |

## Source Code

* <https://github.com/bcgov/common-document-generation-service>

## Requirements

Kubernetes: `>= 1.13.0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| autoscaling.behavior | object | `{"scaleDown":{"policies":[{"periodSeconds":120,"type":"Pods","value":1}],"selectPolicy":"Max","stabilizationWindowSeconds":120},"scaleUp":{"policies":[{"periodSeconds":30,"type":"Pods","value":2}],"selectPolicy":"Max","stabilizationWindowSeconds":0}}` | behavior configures the scaling behavior of the target in both Up and Down directions (scaleUp and scaleDown fields respectively). |
| autoscaling.enabled | bool | `false` | Specifies whether the Horizontal Pod Autoscaler should be created |
| autoscaling.maxReplicas | int | `16` |  |
| autoscaling.minReplicas | int | `2` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| awsSecretOverride.password | string | `nil` |  |
| awsSecretOverride.username | string | `nil` |  |
| config.configMap | object | `{"CACHE_DIR":"/var/lib/file-cache/data","CACHE_SIZE":"2GB","CONVERTER_FACTORY_TIMEOUT":"60000","KC_PUBLICKEY":null,"KC_REALM":null,"KC_SERVERURL":null,"SERVER_BODYLIMIT":"100mb","SERVER_LOGLEVEL":"http","SERVER_PORT":"3000","START_CARBONE":"true","UPLOAD_FIELD_NAME":"template","UPLOAD_FILE_COUNT":"1","UPLOAD_FILE_SIZE":"25MB"}` | These values will be wholesale added to the configmap as is; refer to the cdogs documentation for what each of these values mean and whether you need them defined. Ensure that all values are represented explicitly as strings, as non-string values will not translate over as expected into container environment variables. For configuration keys named `*_ENABLED`, either leave them commented/undefined, or set them to string value "true". |
| config.enabled | bool | `false` |  |
| config.releaseScoped | bool | `false` | This should be set to true if and only if you require configmaps and secrets to be release scoped. In the event you want all instances in the same namespace to share a similar configuration, this should be set to false |
| failurePolicy | string | `"Retry"` |  |
| fluentBit.config.aws.defaultRegion | string | `"ca-central-1"` |  |
| fluentBit.config.aws.kinesisStream | string | `"nress-prod-iit-logs"` |  |
| fluentBit.config.aws.roleArn | string | `nil` |  |
| fluentBit.config.logHostname | string | `"fluentd-csst.apps.silver.devops.gov.bc.ca"` |  |
| fluentBit.config.namespace | string | `nil` |  |
| fluentBit.config.product | string | `"cdogs"` |  |
| fluentBit.enabled | bool | `false` |  |
| fluentBit.image.name | string | `"fluent-bit"` |  |
| fluentBit.image.repository | string | `"docker.io/fluent"` |  |
| fluentBit.image.tag | string | `"2.1.10"` |  |
| fluentBit.resources.limits.cpu | string | `"100m"` |  |
| fluentBit.resources.limits.memory | string | `"64Mi"` |  |
| fluentBit.resources.requests.cpu | string | `"10m"` |  |
| fluentBit.resources.requests.memory | string | `"16Mi"` |  |
| fluentBit.route.metrics.path | string | `"/"` |  |
| fluentBit.service.httpPlugin.name | string | `"http-plugin"` |  |
| fluentBit.service.httpPlugin.port | int | `80` |  |
| fluentBit.service.metrics.name | string | `"metrics"` |  |
| fluentBit.service.metrics.port | int | `2020` |  |
| fullnameOverride | string | `nil` | String to fully override fullname |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"docker.io/bcgovimages"` |  |
| image.tag | string | `nil` |  |
| imagePullSecrets | list | `[]` | Specify docker-registry secret names as an array |
| keycloakSecretOverride.password | string | `nil` |  |
| keycloakSecretOverride.username | string | `nil` |  |
| nameOverride | string | `nil` | String to partially override fullname |
| networkPolicy.enabled | bool | `true` | Specifies whether a network policy should be created |
| persistentVolumeClaim.enabled | bool | `true` | Specifies whether a persistent volume claim should be created |
| persistentVolumeClaim.storageClassName | string | `"netapp-file-standard"` |  |
| persistentVolumeClaim.storageSize | string | `"2G"` |  |
| podAnnotations | object | `{}` | Annotations for cdogs pods |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `2` |  |
| resources.limits.cpu | string | `"1000m"` |  |
| resources.limits.memory | string | `"1Gi"` |  |
| resources.requests.cpu | string | `"50m"` |  |
| resources.requests.memory | string | `"256Mi"` |  |
| route.annotations | object | `{"haproxy.router.openshift.io/timeout":"60s"}` | Annotations to add to the route |
| route.enabled | bool | `true` | Specifies whether a route should be created |
| route.host | string | `"chart-example.local"` |  |
| route.tls.insecureEdgeTerminationPolicy | string | `"Redirect"` |  |
| route.tls.termination | string | `"edge"` |  |
| route.wildcardPolicy | string | `"None"` |  |
| securityContext | object | `{}` |  |
| service.port | int | `3000` |  |
| service.portName | string | `"http"` |  |
| service.type | string | `"ClusterIP"` |  |
| serviceAccount.annotations | object | `{}` | Annotations to add to the service account |
| serviceAccount.enabled | bool | `false` | Specifies whether a service account should be created |
| serviceAccount.name | string | `nil` | The name of the service account to use. If not set and create is true, a name is generated using the fullname template |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.11.3](https://github.com/norwoodj/helm-docs/releases/v1.11.3)
