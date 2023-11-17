# Example usage of CDOGS

If you would like to use the same Keycloak Realm as our hosted service
(`comsvcauth`, as used by this token endpoint `https://dev.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token`), you can request client setup through [the API Services Portal](https://api.gov.bc.ca/devportal/api-directory/3181).

## Node

There is an example of using node.js in file `server.js`.

To run the example:

```
npm install
```

```
CLIENT_ID="your_keycloak_client_id" CLIENT_SECRET="your_keycloak_client_secret" node server.js
```

## Curl

Assuming you have an environment including

```
CLIENT_ID="your_keycloak_client_id"
CLIENT_SECRET="your_keycloak_client_secret"
```

where authentication is required, there are some example bash scripts.

# CDOGS with Docker

```sh
> docker pull bcgovimages/common-document-generation-service:latest
```

## CDOGS without auth

### Quickstart

```sh
> docker run -it --rm -p 3000:3000 bcgovimages/common-document-generation-service:latest
```

### Creating a volume to persist the document cache
```sh
> docker volume create carbone-cache
# View details about your new volume
> docker volume inspect carbone-cache
# Start the CDOGS container with the new volume to persist the document cache.
# /tmp/carbone-files is the default for CACHE_DIR
> docker run -d -p 3000:3000 --name CDOGS -v carbone-cache:/tmp/carbone-files bcgovimages/common-document-generation-service:latest
```

## CDOGS with auth
```sh
> docker run -it --rm -p 3000:3000 -e KC_CLIENTID=<id> -e KC_CLIENTSECRET=<secret> -e KC_ENABLED=true -e KC_PUBLICKEY=<publickey> -e KC_REALM=<realm> -e KC_SERVERURL=<url> bcgovimages/common-document-generation-service:latest
```
