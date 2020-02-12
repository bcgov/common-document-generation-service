const Constants = require('./common-logging-constants');

class CommonLoggingTransformer {
  constructor(options) {
    this._defaults = {
      env: options && options.env ? options.env : Constants.TRANSFORM_DEFAULT_ENV,
      level: options && options.level ? options.level : Constants.TRANSFORM_DEFAULT_LEVEL,
      pattern: options && options.pattern ? options.pattern : '',
      retention: options && options.retention ? options.retention : Constants.TRANSFORM_DEFAULT_RETENTION
    };

    this._metadata = options && options.metadata && options.metadata === Object(options.metadata) ? options.metadata : undefined;
    this._data = options && options.data && options.data === Object(options.data) ? options.data : undefined;
  }

  xform(message, options) {
    if (!message) {
      return;
    }
    const opts = options || {};

    // create object
    const obj = {
      message: undefined,
      data: undefined,
      pattern: opts.pattern || this._defaults.pattern,
      level: opts.level || this._defaults.level,
      retention: opts.retention || this._defaults.retention,
      env: opts.env || this._defaults.env
    };

    // add any additional metadata to the clogs root
    if (this._metadata) {
      obj.metadata = {};
      Object.assign(obj.metadata, this._metadata);
    }

    if (Object.prototype.toString.call(message) === '[object String]' && message.trim().length) {
      obj.message = message.trim();
      if (opts.parse) {
        // if we passed in a parsing function as an option, try to turn message into data...
        const data = opts.parse(obj.message);
        if (data) {
          obj.data = data;
          obj.message = undefined;
        }
      }
    }

    if (message === Object(message)) {
      obj.data = message;
      // add any additional data to the clogs data object
      if (this._data) {
        Object.assign(obj.data, this._data);
      }
    }

    if (!(obj.message || obj.data)) {
      return;
    }

    return obj;

  }
}

module.exports = CommonLoggingTransformer;
