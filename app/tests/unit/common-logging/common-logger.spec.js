const config = require('config');

const helper = require('../../common/helper');

const CommonLogger = require('../../../src/common-logging/common-logger');

helper.logHelper();

describe('common-logger constructor', () => {
  const CommonLoggingHttp = require('../../../src/common-logging/common-logging-http');
  const CommonLoggingQueue = require('../../../src/common-logging/common-logging-queue');

  test('constructor, uses defaults when no parameters', () => {
    const logger = new CommonLogger();
    expect(logger._transformer).toBeTruthy();
    expect(logger._queue).toBeTruthy();
    expect(logger._transfer).toBeTruthy();
  });

  test('constructor, uses parameters when no parameters', () => {
    const clogsHttp = new CommonLoggingHttp(config.get('clogs.http'));
    const clogsQueue = new CommonLoggingQueue(config.get('clogs.queue'));
    const xform = require('../../../src/common-logging/common-logging-xform');

    const logger = new CommonLogger(clogsHttp, clogsQueue, xform);

    expect(logger._transfer).toBeTruthy();
    expect(logger._transfer).toBe(clogsHttp);

    expect(logger._queue).toBeTruthy();
    expect(logger._queue).toBe(clogsQueue);

    expect(logger._transformer).toBeTruthy();
    expect(logger._transformer).toBe(xform);
  });

});

describe('common-logger log', () => {
  // we will be mocking these classes and functions...
  const CommonLoggingHttp = require('../../../src/common-logging/common-logging-http');
  const CommonLoggingQueue = require('../../../src/common-logging/common-logging-queue');
  const xform = require('../../../src/common-logging/common-logging-xform');

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

  jest.mock('../../../src/common-logging/common-logging-xform');
  xform.mockImplementation((s, opts) => {
    return {
      message: s,
      data: undefined,
      level: opts.level || 'info',
      pattern: opts.pattern || '',
      retention: opts.retention || 'default'
    };
  });

  beforeEach(() => {
    mockXfer.mockClear();
    mockPush.mockClear();
    mockFlush.mockClear();
    xform.mockClear();
  });

  test('log message', async () => {
    const clogsHttp = new CommonLoggingHttp(config.get('clogs.http'));
    const clogsQueue = new CommonLoggingQueue(config.get('clogs.queue'));
    const logger = new CommonLogger(clogsHttp, clogsQueue, xform);

    const s = 'my message string';
    const l = 'test';
    await logger.log(s, {level: l});
    expect(xform).toHaveBeenCalledTimes(1);
    expect(xform).toHaveBeenCalledWith(s, {level: l});
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({message: s, data: undefined, level: l, pattern: '', retention: 'default'});
  });

  test('flush immediate', async () => {
    const clogsHttp = new CommonLoggingHttp(config.get('clogs.http'));
    const clogsQueue = new CommonLoggingQueue(config.get('clogs.queue'));
    const logger = new CommonLogger(clogsHttp, clogsQueue, xform);

    await logger.flushImmediate();
    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockFlush).toHaveBeenCalledWith(true, true, false);
    expect(mockXfer).toHaveBeenCalledTimes(1);
    expect(mockXfer).toHaveBeenCalledWith(queueItems);
  });

});
