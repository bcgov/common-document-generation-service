# CDOGS with Docker

```
docker pull bcgovimages/common-document-generation-service:latest
```

```
docker run -it --rm -p 3000:3000 bcgovimages/common-document-generation-service:latest
```

```
docker run -it --rm -p 3000:3000 -e KC_CLIENTID=<id> -e KC_CLIENTSECRET=<secret> -e KC_ENABLED=true -e KC_PUBLICKEY=<publickey> -e KC_REALM=<realm> -e KC_SERVERURL=<url> bcgovimages/common-document-generation-service:latest
```
