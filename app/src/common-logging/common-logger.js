const defaultQueue = require('./common-logging-queue');
const defaultXform = require('./common-logging-xform');

class StdOutXfer {
  async xfer(messages) {
    if (messages) {
      const batch = Array.isArray(messages) ? messages : [messages];
      if (!batch.length) {
        return;
      }
      batch.forEach(m => {
        if (m.message) {
          process.stdout.write(`common-logging - ${m.message.trim()}\n`);
        } else {
          process.stdout.write(`common-logging - ${JSON.stringify(m.data)}\n`);
        }
      });
    }
  }
}
const defaultXfer = new StdOutXfer();

class CommonLogger {

  constructor(transfer, queue, transformer) {
    this._transformer = transformer || defaultXform;
    this._queue = queue || defaultQueue;
    this._transfer = transfer || defaultXfer;

    this._queue.on('flush', async (items) => {
      if (items && items.length) {
        await this._transfer.xfer(items);
      }
    });
  }

  async log(message, options) {
    const o = this._transformer(message, options);
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
