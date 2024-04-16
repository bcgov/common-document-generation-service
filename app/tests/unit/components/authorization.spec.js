const config = require('config');
const jwt = require('jsonwebtoken');

const { getConfigBoolean } = require('../../../src/components/utils');
const { authenticate } = require('../../../src/middleware/authorization');
const Problem = require('api-problem');

jest.mock('config');
jest.mock('jsonwebtoken');
jest.mock('../../../src/components/utils'); // getConfigBoolean

const mockReq = {
  get: jest.fn()
};
const mockRes = jest.fn();
const mockNext = jest.fn();

describe('authenticate', () => {

  describe('Keycloak is not enabled', () => {

    beforeEach(() => {
      jest.resetAllMocks();
      getConfigBoolean.mockReturnValueOnce(false);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('does not validate JWT when keycloak is disabled in the config', () => {
      authenticate(mockReq, mockRes, mockNext);

      expect(getConfigBoolean).toHaveBeenCalledTimes(1);
      expect(mockReq.get).toHaveBeenCalledTimes(0);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keycloak is enabled', () => {

    const authHeader = 'Bearer xxxxx';
    const publicKey = '-----BEGIN PUBLIC KEY-----\ninsert_spki_here\n-----END PUBLIC KEY-----';
    const keycloakServerUrl = 'https://dev.loginproxy.gov.bc.ca/auth';
    const keycloakRealm = 'comsvcauth';
    const clientId = 'CDOGS';

    beforeEach(() => {
      jest.resetAllMocks();
      getConfigBoolean.mockReturnValueOnce(true);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('authenticates when keycloak is enabled and JWT is valid', () => {
      mockReq.get.mockReturnValueOnce(authHeader);
      config.has.mockReturnValueOnce(true);       // keycloak.publicKey
      config.get.mockReturnValueOnce(publicKey);
      config.get.mockReturnValueOnce(keycloakServerUrl);
      config.get.mockReturnValueOnce(keycloakRealm);
      config.get.mockReturnValueOnce(clientId);
      jwt.verify.mockReturnValueOnce(undefined);  // jwt.verify throws error on fail; it doesn't return anything on success

      authenticate(mockReq, mockRes, mockNext);

      expect(getConfigBoolean).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledTimes(4);
      expect(jwt.verify).toHaveBeenCalledTimes(1);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('throws an error when Keycloak server public key is not defined in config', () => {
      mockReq.get.mockReturnValueOnce(authHeader);
      config.has.mockReturnValueOnce(false);       // keycloak.publicKey

      expect(() => {
        authenticate(mockReq, mockRes, mockNext);
      }).toThrow(Error);

      expect(config.has).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledTimes(0);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it('throws an error when Keycloak server URL is not defined in config', () => {
      mockReq.get.mockReturnValueOnce(authHeader);
      config.has.mockReturnValueOnce(true);       // keycloak.publicKey
      config.get.mockReturnValueOnce(publicKey);
      config.get.mockImplementation(() => {
        throw new Error();
      });
      config.get.mockReturnValueOnce(keycloakRealm);

      expect(() => {
        authenticate(mockReq, mockRes, mockNext);
      }).toThrow(Error);

      expect(config.has).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledTimes(3);
      expect(jwt.verify).toHaveBeenCalledTimes(0);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it('throws an error when Keycloak realm is not defined in config', () => {
      mockReq.get.mockReturnValueOnce(authHeader);
      config.has.mockReturnValueOnce(true);       // keycloak.publicKey
      config.get.mockReturnValueOnce(publicKey);
      config.get.mockReturnValueOnce(keycloakServerUrl);
      config.get.mockImplementation(() => {
        throw new Error();
      });

      expect(() => {
        authenticate(mockReq, mockRes, mockNext);
      }).toThrow(Error);

      expect(config.has).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledTimes(3);
      expect(jwt.verify).toHaveBeenCalledTimes(0);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it('fails when JWT is expired', () => {
      const apiProblemSpy = jest.spyOn(Problem.prototype, 'send').mockImplementation(() => this);

      mockReq.get.mockReturnValueOnce(authHeader);
      config.has.mockReturnValueOnce(true);     // keycloak.publicKey
      config.get.mockReturnValueOnce(publicKey);
      jwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError({
          name: 'TokenExpiredError',
          message: 'jwt expired',
          expiredAt: 1408621000
        });
      });

      authenticate(mockReq, mockRes, mockNext);

      expect(getConfigBoolean).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledTimes(4);
      expect(apiProblemSpy).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it('fails when JWT is not valid yet', () => {
      const apiProblemSpy = jest.spyOn(Problem.prototype, 'send').mockImplementation(() => this);

      mockReq.get.mockReturnValueOnce(authHeader);
      config.has.mockReturnValueOnce(true);     // keycloak.publicKey
      config.get.mockReturnValueOnce(publicKey);
      jwt.verify.mockImplementation(() => {
        throw new jwt.NotBeforeError({
          name: 'NotBeforeError',
          message: 'jwt not active',
          date: '2018-10-04T16:10:44.000Z'
        });
      });

      authenticate(mockReq, mockRes, mockNext);

      expect(getConfigBoolean).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledTimes(4);
      expect(apiProblemSpy).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

    it('fails when JWT is malformed', () => {
      const apiProblemSpy = jest.spyOn(Problem.prototype, 'send').mockImplementation(() => this);

      mockReq.get.mockReturnValueOnce(authHeader);
      config.has.mockReturnValueOnce(true);     // keycloak.publicKey
      config.get.mockReturnValueOnce(publicKey);
      jwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError({
          name: 'JsonWebTokenError',
          message: 'jwt malformed',
        });
      });

      authenticate(mockReq, mockRes, mockNext);

      expect(getConfigBoolean).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledTimes(4);
      expect(apiProblemSpy).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(0);
    });

  });

});
