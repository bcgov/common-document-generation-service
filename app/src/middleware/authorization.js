const config = require('config');
const jwt = require('jsonwebtoken');
const Problem = require('api-problem');

const { getConfigBoolean } = require('../components/utils');

/**
 * @function _spkiWrapper
 * Wraps an SPKI key with PEM header and footer
 * @param {string} spki The PEM-encoded Simple public-key infrastructure string
 * @returns {string} The PEM-encoded SPKI with PEM header and footer
 */
const _spkiWrapper = (spki) => `-----BEGIN PUBLIC KEY-----\n${spki}\n-----END PUBLIC KEY-----`;

module.exports = {
  /**
   * Enables JWT verification only if environment has it enabled.
   */
  authenticate: (req, res, next) => {

    if (getConfigBoolean('keycloak.enabled')) {
      const authorization = req.get('Authorization');
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return new Problem(401, {
          detail: 'An authorization header of the format "Bearer {token}" is required'
        }).send(res);
      }
      const bearerToken = authorization.substring(7);

      try {
        const publicKey = config.get('keycloak.publicKey');
        const pemKey = publicKey.startsWith('-----BEGIN') ? publicKey : _spkiWrapper(publicKey);

        jwt.verify(bearerToken, pemKey, {
          issuer: `${config.get('keycloak.serverUrl')}/realms/${config.get('keycloak.realm')}`,
          audience: config.get('keycloak.clientId')
        });
        next();

      } catch (err) {
        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError || err instanceof jwt.NotBeforeError) {
          return new Problem(401, {
            detail: err.message
          }).send(res);
        }
        else {
          // Return HTTP 401 only for JWT errors; the rest should be HTTP 500
          if (!config.has('keycloak.publicKey')) {
            throw new Error('OIDC environment variable KC_PUBLICKEY or keycloak.publicKey must be defined');
          } else {
            throw(err);
          }
        }
      }

    } else {
      next();
    }
  }
};
