const atob = require('atob');
const Problem = require('api-problem');

/** Authorized Party Middleware
 *  This middleware will add a property to the request: authorizedParty.
 *
 *  We will use the azp (Authorized Party) from the JWT and store that as
 *  authorizedParty.
 *
 * @see module:keycloak
 */

const authorizedParty = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    const jwt = atob.atob(base64);
    const jsonWebToken = JSON.parse(jwt);
    req.authorizedParty = jsonWebToken.azp;
  } catch (err) {
    req.authorizedParty = undefined;
  }
  next();
};

/** Authorized Party Validator Middleware
 *
 *  This middleware must be called after our keycloak protect and after authorizedParty middleware.
 *
 *  This middleware will check if the authorized party token is on the request.
 *
 * @see module:keycloak
 */

const authorizedPartyValidator = async (req, res, next) => {
  try {
    if (!req.authorizedParty) throw Error('No AZP');
  } catch (err) {
    return new Problem(400, {
      detail: 'Could not determine Authorized Party'
    }).send(res);
  }
  next();
};

module.exports = { authorizedParty, authorizedPartyValidator };
