const config = require('config');
const fs = require('fs');
const path = require('path');
const { load } = require('js-yaml');
const { getConfigBoolean } = require('../components/utils');

module.exports = {
  /**
   * @function getDocHTML
   * Gets and formats a ReDoc HTML page
   * @param {string} version Desired version (`v1` or `v2`)
   * @returns {string} A ReDoc HTML page string
   */
  getDocHTML: (version) => `<!DOCTYPE html>
  <html>
    <head>
      <title>Common Document Generation Service API - Documentation ${version}</title>
      <!-- needed for adaptive design -->
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

      <!-- ReDoc doesn't change outer page styles -->
      <style>
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <redoc spec-url='/api/${version}/api-spec.yaml'></redoc>
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
    </body>
  </html>`,

  /**
   * @function getSpec
   * Gets and formats an OpenAPI spec object
   * @param {string} version Desired version (`v1` or `v2`)
   * @returns {object} An OpenAPI spec object
   */
  getSpec: (version) => {
    const rawSpec = fs.readFileSync(path.join(__dirname, `../docs/${version}.api-spec.yaml`), 'utf8');
    const spec = load(rawSpec);
    spec.servers[0].url = `/api/${version}`;

    if (getConfigBoolean('keycloak.enabled')) {
      // Dynamically update OIDC endpoint url
      spec.components.securitySchemes.OpenID.openIdConnectUrl = `${config.get('keycloak.serverUrl')}/realms/${config.get('keycloak.realm')}/.well-known/openid-configuration`;
    } else {
      // Drop all security clauses as keycloak is not enabled
      delete spec.security;
      delete spec.components.securitySchemes;
      Object.keys(spec.paths).forEach((path) => {
        Object.keys(path).forEach((method) => {
          if (method.security) delete method.security;
        });
      });
    }

    return spec;
  }
};
