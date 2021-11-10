# Example usage of CDOGS

If you want to use the KeyCloak Realm `jbd6rnxw` hosted by the Common Services Team (as used by this token endpoint `https://dev.oidc.gov.bc.ca/auth/realms/jbd6rnxw/protocol/openid-connect/token`, you can request client setup with [GETOK](https://getok.nrs.gov.bc.ca/app/about)

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

There is an example of a simple bash script in `curl.sh`.
