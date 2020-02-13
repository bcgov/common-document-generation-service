const CommonLoggingQueue = require('./common-logging-queue');
const CommonLoggingTransformer = require('./common-logging-transformer');
const Constants = require('./common-logging-constants');

class StdOutXfer {
  async xfer(messages) {
    if (messages) {
      const batch = Array.isArray(messages) ? messages : [messages];
      if (!batch.length) {
        return;
      }
      batch.forEach(m => {
        if (m.message) {
          process.stdout.write(`${Constants.COMMON_LOGGING_PREFIX} ${m.message.trim()}\n`);
        } else {
          process.stdout.write(`${Constants.COMMON_LOGGING_PREFIX} ${JSON.stringify(m.data)}\n`);
        }
      });
    }
  }
}

const defaultXfer = new StdOutXfer();

class CommonLogger {

  constructor(transfer, queue, transformer) {
    this._transformer = transformer || new CommonLoggingTransformer();
    this._queue = queue || new CommonLoggingQueue();
    this._transfer = transfer || defaultXfer;

    if (this._queue && this._queue.on) {
      this._queue.on('flush', async (items) => {
        if (items && items.length) {
          await this._transfer.xfer(items);
        }
      });
    }
  }

  async log(message, options) {
    const o = this._transformer.xform(message, options);
    if (o) {
      await this._queue.push(o);
    }
  }

  async flushImmediate() {
    const items = await this._queue.flush(true, true, false);
    if (items && items.length) {
      await this._transfer.xfer(items);
    }
  }

}

module.exports = CommonLogger;
