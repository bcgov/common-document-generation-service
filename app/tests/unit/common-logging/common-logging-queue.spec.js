const helper = require('../../common/helper');

const CommonLoggingQueue = require('../../../src/common-logging/common-logging-queue');
const Constants = require('../../../src/common-logging/common-logging-constants');

helper.logHelper();

describe('common-logging-queue constructor', () => {

  test('constructor, uses defaults when no options', () => {
    const clogsQueue = new CommonLoggingQueue();
    expect(clogsQueue._maxBatchSize).toBe(Constants.QUEUE_DEFAULT_MAX_BATCH_SIZE);
    expect(clogsQueue._batchTimeout).toBe(Constants.QUEUE_DEFAULT_BATCH_TIMEOUT);
    expect(clogsQueue._initialDelay).toBe(Constants.QUEUE_DEFAULT_INITIAL_DELAY);
  });

  test('constructor, accepts options', () => {
    const clogsQueue = new CommonLoggingQueue({maxBatchSize: 1, batchTimeout: 5000, initialDelay: 10000});
    expect(clogsQueue._maxBatchSize).toBe(1);
    expect(clogsQueue._batchTimeout).toBe(5000);
    expect(clogsQueue._initialDelay).toBe(10000);
  });

  test('constructor, defaults bad options', () => {
    const clogsQueue = new CommonLoggingQueue({
      maxBatchSize: 1,
      batchTimeout: {value: 'five thousand'},
      initialDelay: 10000
    });
    expect(clogsQueue._maxBatchSize).toBe(1);
    expect(clogsQueue._batchTimeout).toBe(Constants.QUEUE_DEFAULT_BATCH_TIMEOUT);
    expect(clogsQueue._initialDelay).toBe(10000);
  });

});

describe('common-logging-queue push/flush', () => {

  test('push adds to queue', async () => {
    const clogsQueue = new CommonLoggingQueue({maxBatchSize: 1, initialDelay: Infinity});
    await clogsQueue.push({message: 'hi'});
    expect(clogsQueue._queue.getLength()).toBe(1);
  });

  test('flush gets batch from queue', async () => {
    const clogsQueue = new CommonLoggingQueue({maxBatchSize: 1, initialDelay: Infinity});
    await clogsQueue.push({message: 'hi'});
    await clogsQueue.push({message: 'there'});
    expect(clogsQueue._queue.getLength()).toBe(2);
    const batch = await clogsQueue.flush(true, false, false);
    expect(batch).toHaveLength(1);
    expect(clogsQueue._queue.getLength()).toBe(1);
  });

  test('flush (all) gets all from queue', async () => {
    const clogsQueue = new CommonLoggingQueue({maxBatchSize: 1, initialDelay: Infinity});
    await clogsQueue.push({message: 'hi'});
    await clogsQueue.push({message: 'there'});
    expect(clogsQueue._queue.getLength()).toBe(2);
    const batch = await clogsQueue.flush(true, true, false);
    expect(batch).toHaveLength(2);
  });

});


describe('common-logging-queue flush timer', () => {

  beforeAll(() => {
    jest.useFakeTimers();
  });

  test('flush called on timeout', async () => {
    const clogsQueue = new CommonLoggingQueue({maxBatchSize: 1, batchTimeout: 10000, initialDelay: 10000});
    const spy = jest.spyOn(clogsQueue, 'flush');
    await clogsQueue.push({message: 'hi'});
    await jest.runAllTimers();
    expect(spy).toHaveBeenCalledTimes(1);
  });

});
