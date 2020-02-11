const EE = require('events').EventEmitter;

const MemoryQueue = require('./queue-memory');
const Mutex = require('./mutex-await');

let batchTimeoutId = null;
const batchTimer = (queue, pollInterval) => {
  if (!batchTimeoutId && pollInterval < Infinity) {
    batchTimeoutId = setTimeout(() => {
      batchTimeoutId = null;
      queue.flush();
    }, pollInterval);
  }
};

const intOption = (value, defaultValue) => {
  try {
    return parseInt(value) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

class CommonLoggingQueue extends EE {
  constructor(options) {
    super();
    let opts = options || {};
    this._batchSize = intOption(opts.batchSize, 50);
    this._batchTimeout = intOption(opts.batchTimeout, Infinity);
    this._initialDelay = intOption(opts.initialDelay, 1000);
    this._queue = new MemoryQueue();
    this._mutex = new Mutex();

    setTimeout(() => {
      batchTimer(this, this._batchTimeout);
    }, this._initialDelay);
  }

  async push(item) {
    // lock queue - no reading...
    let unlock = await this._mutex.lock();
    this._queue.enqueue(item);
    // release mutex, allow reading from the queue
    unlock();
  }

  async flush(immediate = false, all = false, poll = true) {
    // 2 parts...
    // get the batch items
    const items = [];

    // lock queue - no writing
    let unlock = await this._mutex.lock();
    const size = all ? Infinity : this._batchSize;
    while (this._queue.getLength() && (items.length < size)) {
      items.push(this._queue.dequeue());
    }
    // release mutex, allow writing to the queue
    unlock();
    if (immediate) {
      return items;
    } else {
      this.emit('flush', items);
    }
    if (poll) {
      batchTimer(this, this._batchTimeout);
    }
  }

}

module.exports = CommonLoggingQueue;
