const isString = require('lodash.isstring');

const Constants = require('./common-logging-constants');
const intercept = require('./common-logging-intercept');
const Mutex = require('./mutex-await');

class CommonLoggingStdout {
  constructor() {
    this.unhookIntercept = null;
    this._mutex = new Mutex();
    this._stdoutMessages = [];
    this._logger = null;
  }

  set logger(value) {
    this._logger = value;
  }

  hook(logger = null) {
    if (!this.unhookIntercept) {
      if (logger) {
        this._logger = logger;
      }
      this.unhookIntercept = intercept(async (text) => {
        // remove any control sequences
        if (text && isString(text)) {
          // remove any control sequences or ascii color...
          // eslint-disable-next-line no-control-regex
          const msg = text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
          // new line...
          if (/\r|\n/.exec(msg)) {

            let unlock = await this._mutex.lock();
            this._stdoutMessages.push(msg);
            const s = this._stdoutMessages.join('');
            this._stdoutMessages = [];
            unlock();

            if (!s.startsWith(Constants.COMMON_LOGGING_PREFIX) && this._logger) {
              this._logger.log(s);
            }
          } else {
            this._stdoutMessages.push(msg);
          }
        }
      });
    }
  }

  unhook() {
    if (this.unhookIntercept) {
      this.unhookIntercept();
    }
  }
}

module.exports = CommonLoggingStdout;
