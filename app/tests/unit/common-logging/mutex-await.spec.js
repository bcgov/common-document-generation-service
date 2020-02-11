const helper = require('../../common/helper');

const Mutex = require('../../../src/common-logging/mutex-await');

helper.logHelper();

describe('mutex-await', () => {

  test('constructor creates unlocked mutex', () => {
    const mutex = new Mutex();
    expect(mutex).toBeTruthy();
    expect(mutex.isLocked()).toBeFalsy();
  });

  test('mutex can lock/unlock', async () => {
    const mutex = new Mutex();
    expect(mutex).toBeTruthy();
    expect(mutex.isLocked()).toBeFalsy();
    const unlock = await mutex.lock();
    expect(mutex.isLocked()).toBeTruthy();
    unlock();
    expect(mutex.isLocked()).toBeFalsy();
  });

});
