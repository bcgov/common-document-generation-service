const toArray = require('lodash.toarray');

// Intercept stdout and stderr to pass output thru callback.
//
//  Optionally, takes two callbacks.
//    If two callbacks are specified,
//      the first intercepts stdout, and
//      the second intercepts stderr.
//
// returns an unhook() function, call when done intercepting
module.exports = function (stdoutIntercept, stderrIntercept) {
  stderrIntercept = stderrIntercept || stdoutIntercept;

  let old_stdout_write = process.stdout.write;
  let old_stderr_write = process.stderr.write;

  process.stdout.write = (function (write) {
    // eslint-disable-next-line no-unused-vars
    return function (string, encoding, fd) {
      var args = toArray(arguments);
      args[0] = interceptor(string, stdoutIntercept);
      write.apply(process.stdout, args);
    };
  }(process.stdout.write));

  process.stderr.write = (function (write) {
    // eslint-disable-next-line no-unused-vars
    return function (string, encoding, fd) {
      var args = toArray(arguments);
      args[0] = interceptor(string, stderrIntercept);
      write.apply(process.stderr, args);
    };
  }(process.stderr.write));

  function interceptor(string, callback) {
    // only intercept the string
    let result = callback(string);
    if (typeof result == 'string') {
      string = result.replace(/\n$/, '') + (result && (/\n$/).test(string) ? '\n' : '');
    }
    return string;
  }

  // puts back to original
  return function unhook() {
    process.stdout.write = old_stdout_write;
    process.stderr.write = old_stderr_write;
  };

};
