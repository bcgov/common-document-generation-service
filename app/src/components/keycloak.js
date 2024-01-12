const config = require('config');
const Keycloak = require('keycloak-connect');

module.exports = new Keycloak({}, {
  bearerOnly: true,
  'confidential-port': 0,
  clientId: config.has('keycloak.clientId') ? config.get('keycloak.clientId') : undefined,
  'policy-enforcer': {},
  realm: config.has('keycloak.realm') ? config.get('keycloak.realm') : undefined,
  realmPublicKey: config.has('keycloak.publicKey') ? config.get('keycloak.publicKey') : undefined,
  secret: config.has('keycloak.clientSecret') ? config.get('keycloak.clientSecret') : undefined,
  serverUrl: config.has('keycloak.serverUrl') ? config.get('keycloak.serverUrl') : undefined,
  'ssl-required': 'external',
  'use-resource-role-mappings': false,
  'verify-token-audience': true
});
