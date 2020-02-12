module.exports = (message, options) => {
  if (!message) {
    return;
  }
  let opts = options || {};

  // create object
  const obj = {
    message: undefined,
    data: undefined,
    pattern: opts.pattern || '',
    level: opts.level || 'info',
    retention: opts.retention || 'default'
  };

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
  }

  if (!(obj.message || obj.data)) {
    return;
  }

  return obj;

};
