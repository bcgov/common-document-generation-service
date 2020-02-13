const config = require('config');

const helper = require('../../common/helper');

const CommonLogger = require('../../../src/common-logging/common-logger');

const httpConfig = {
  tokenUrl: config.get('cmnsrv.tokenUrl'),
  clientId: config.get('cmnsrv.clientId'),
  clientSecret: config.get('cmnsrv.clientSecret'),
  apiUrl: config.get('clogs.http.apiUrl')
};
const queueConfig = {
  maxBatchSize: config.get('clogs.queue.maxBatchSize'),
  batchTimeout: config.get('clogs.queue.batchTimeout'),
  initialDelay: config.get('clogs.queue.initialDelay')
};
const xformConfig = {
  env: config.get('clogs.metadata.env')
};

helper.logHelper();

describe('common-logger constructor', () => {
  const CommonLoggingHttp = require('../../../src/common-logging/common-logging-http');
  const CommonLoggingQueue = require('../../../src/common-logging/common-logging-queue');
  const CommonLoggingTransformer = require('../../../src/common-logging/common-logging-transformer');

  test('constructor, uses defaults when no parameters', () => {
    const logger = new CommonLogger();
    expect(logger._transformer).toBeTruthy();
    expect(logger._queue).toBeTruthy();
    expect(logger._transfer).toBeTruthy();
  });

  test('constructor, uses parameters', () => {
    const clogsHttp = new CommonLoggingHttp(httpConfig);
    const clogsQueue = new CommonLoggingQueue(queueConfig);
    const clogsXform = new CommonLoggingTransformer(xformConfig);

    const logger = new CommonLogger(clogsHttp, clogsQueue, clogsXform);

    expect(logger._transfer).toBeTruthy();
    expect(logger._transfer).toBe(clogsHttp);

    expect(logger._queue).toBeTruthy();
    expect(logger._queue).toBe(clogsQueue);

    expect(logger._transformer).toBeTruthy();
    expect(logger._transformer).toBe(clogsXform);
  });

});

describe('common-logger log', () => {
  // we will be mocking these classes and functions...
  const CommonLoggingHttp = require('../../../src/common-logging/common-logging-http');
  const CommonLoggingQueue = require('../../../src/common-logging/common-logging-queue');
  const CommonLoggingTransformer = require('../../../src/common-logging/common-logging-transformer');

  // mock data/queue
  const queueItems = [
    {message: 'item one', data: undefined, level: 'info', pattern: '', retention: 'default'},
    {message: 'item two', data: undefined, level: 'info', pattern: '', retention: 'default'},
    {message: 'item three', data: undefined, level: 'info', pattern: '', retention: 'default'}];

  // mocks
  const mockXfer = jest.fn();
  jest.mock('../../../src/common-logging/common-logging-http', () => {
    return jest.fn().mockImplementation(() => {
      return {
        xfer: mockXfer
      };
    });
  });

  const mockPush = jest.fn();
  // eslint-disable-next-line no-unused-vars
  const mockFlush = jest.fn((immediate, all, poll) => {
    if (all) {
      return queueItems;
    }
    return [queueItems[1]];
  });

  jest.mock('../../../src/common-logging/common-logging-queue', () => {
    return jest.fn().mockImplementation(() => {
      return {
        push: mockPush,
        flush: mockFlush
      };
    });
  });


  const mockXform = jest.fn().mockImplementation((s, opts) => {
    return {
      message: s,
      data: undefined,
      level: opts.level || 'info',
      pattern: opts.pattern || '',
      retention: opts.retention || 'default'
    };
  });
  jest.mock('../../../src/common-logging/common-logging-transformer', () => {
    return jest.fn().mockImplementation(() => {
      return {
        xform: mockXform
      };
    });
  });

  beforeEach(() => {
    mockXfer.mockClear();
    mockPush.mockClear();
    mockFlush.mockClear();
    mockXform.mockClear();
  });

  test('log message', async () => {
    const clogsHttp = new CommonLoggingHttp(httpConfig);
    const clogsQueue = new CommonLoggingQueue(queueConfig);
    const clogsXform = new CommonLoggingTransformer(xformConfig);
    const logger = new CommonLogger(clogsHttp, clogsQueue, clogsXform);

    const s = 'my message string';
    const l = 'test';
    await logger.log(s, {level: l});
    expect(mockXform).toHaveBeenCalledTimes(1);
    expect(mockXform).toHaveBeenCalledWith(s, {level: l});
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({message: s, data: undefined, level: l, pattern: '', retention: 'default'});
  });

  test('flush immediate', async () => {
    const clogsHttp = new CommonLoggingHttp(httpConfig);
    const clogsQueue = new CommonLoggingQueue(queueConfig);
    const clogsXform = new CommonLoggingTransformer(xformConfig);
    const logger = new CommonLogger(clogsHttp, clogsQueue, clogsXform);

    await logger.flushImmediate();
    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockFlush).toHaveBeenCalledWith(true, true, false);
    expect(mockXfer).toHaveBeenCalledTimes(1);
    expect(mockXfer).toHaveBeenCalledWith(queueItems);
  });

});
