const config = require('config');
const Keycloak = require('keycloak-connect');

module.exports = new Keycloak({}, {
  bearerOnly: true,
  'confidential-port': 0,
  clientId: config.get('keycloak.clientId'),
  'policy-enforcer': {},
  realm: config.get('keycloak.realm'),
  secret: config.get('keycloak.clientSecret'),
  serverUrl: config.get('keycloak.serverUrl'),
  'ssl-required': 'external',
  'use-resource-role-mappings': true,
  'verify-token-audience': true
});
