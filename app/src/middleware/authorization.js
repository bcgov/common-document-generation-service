const config = require('config');

const keycloak = require('../components/keycloak');

module.exports = {
  /**
   * @function protect
   * Enables keycloak protect only if environment has it enabled
   * @param {string} [role=undefined] Keycloak protect role-based authorization
   * @returns {function} An express/connect compatible middleware function
   */
  protect: (role = undefined) => {
    if (config.has('keycloak.enabled')) {
      return keycloak.protect(role);
    } else {
      return (_req, _res, next) => next();
    }
  }
};
