const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mockAxios = new MockAdapter(axios);

const helper = require('../../common/helper');

const CommonLoggingHttp = require('../../../src/common-logging/common-logging-http');
const Constants = require('../../../src/common-logging/common-logging-constants');

helper.logHelper();

const defaultOptions = {
  apiUrl: 'http://localhost',
  clientId: 'CLOGS_HTTP_CLIENTID',
  clientSecret: 'CLOGS_HTTP_CLIENTSECRET',
  tokenUrl: 'CLOGS_HTTP_TOKENURL'
};

describe('common-logging-http constructor', () => {

  test('constructor errors with no parameters', () => {
    expect(() => new CommonLoggingHttp()).toThrow(Error);
  });

  test('constructor errors with no tokenUrl', () => {
    const options = Object.assign({}, defaultOptions);
    delete options.tokenUrl;
    expect(() => new CommonLoggingHttp(options)).toThrow(Error);
  });

  test('constructor errors with no clientId', () => {
    const options = Object.assign({}, defaultOptions);
    delete options.clientId;
    expect(() => new CommonLoggingHttp(options)).toThrow(Error);
  });

  test('constructor errors with no clientSecret', () => {
    const options = Object.assign({}, defaultOptions);
    delete options.clientSecret;
    expect(() => new CommonLoggingHttp(options)).toThrow(Error);
  });

  test('constructor errors with no apiUrl', () => {
    const options = Object.assign({}, defaultOptions);
    delete options.apiUrl;
    expect(() => new CommonLoggingHttp(options)).toThrow(Error);
  });

  test('constructor works with populated options', () => {
    const options = Object.assign({}, defaultOptions);
    const clogsHttp = new CommonLoggingHttp(options);
    expect(clogsHttp).toBeTruthy();
  });

});

describe('common-logging-http xfer', () => {
  const axiosSpy = jest.spyOn(axios, 'post');
  const apiUrl = `${defaultOptions.apiUrl}/api/v1/log`;

  const payload = [{
    message: 'hello'
  }];

  it('should return 201 on success', async () => {
    const clogsHttp = new CommonLoggingHttp(defaultOptions);
    clogsHttp.axios = axios.create();
    mockAxios.onPost(apiUrl).reply(201, 'truthy');
    const messages = payload;
    const result = await clogsHttp.xfer(messages);
    expect(result.success).toBeTruthy();
    expect(result.status).toBe(Constants.TRANSFER_GOOD_STATUS);
  });

  it('should return -1 when undefined messages passed in ', async () => {
    const clogsHttp = new CommonLoggingHttp(defaultOptions);
    clogsHttp.axios = axios.create();
    const messages = undefined;
    const result = await clogsHttp.xfer(messages);

    expect(axiosSpy).toHaveBeenCalledTimes(0);
    expect(result.success).toBeFalsy();
    expect(result.status).toBe(Constants.TRANSFER_NO_MESSAGES);
  });

  it('should return -2 when no messages passed in ', async () => {
    const clogsHttp = new CommonLoggingHttp(defaultOptions);
    clogsHttp.axios = axios.create();
    const messages = [];
    const result = await clogsHttp.xfer(messages);

    expect(axiosSpy).toHaveBeenCalledTimes(0);
    expect(result.success).toBeFalsy();
    expect(result.status).toBe(Constants.TRANSFER_NO_BATCH_ITEMS);
  });

  it('should return status code when not in error', async () => {
    const clogsHttp = new CommonLoggingHttp(defaultOptions);
    clogsHttp.axios = axios.create();
    mockAxios.onPost(apiUrl).reply(200, 'falsy');
    const messages = payload;
    const result = await clogsHttp.xfer(messages);
    expect(result.success).toBeFalsy();
    expect(result.status).toBe(200);
  });

  it('should return status code when in error', async () => {
    const clogsHttp = new CommonLoggingHttp(defaultOptions);
    clogsHttp.axios = axios.create();
    mockAxios.onPost(apiUrl).reply(500, 'falsy');
    const messages = payload;
    const result = await clogsHttp.xfer(messages);
    expect(result.success).toBeFalsy();
    expect(result.status).toBe(500);
  });


});
