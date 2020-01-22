const axios = require('axios');
const config = require('config');
const intercept = require('intercept-stdout');
const isString = require('lodash.isstring');

let unhook_intercept;
let msgs = [];
const clogsSvc = {

  hook: () => {
    if (!unhook_intercept) {
      unhook_intercept = intercept(function (text) {
        // remove any control sequences
        if (text && isString(text)) {
          // eslint-disable-next-line no-control-regex
          const msg = text.replace(/\x1b\[\d+m/g, '');
          if (/\r|\n/.exec(msg)) {
            msgs.push(msg);
            const s = msgs.join('');
            msgs = [];
            clogsSvc.log(s);
          } else {
            msgs.push(msg);
          }
        }
      });
    }
  },

  unhook: () => {
    if (unhook_intercept) {
      unhook_intercept();
    }
  },

  log: async msg => {
    try {
      let data = msg;
      let contentType = 'text/plain';
      try {
        const o = JSON.parse(msg);
        if (o) {
          contentType = 'application/json';
          data = o;
        }
      } catch (err) {
        contentType = 'text/plain';
      }

      const response = await axios.post(
        `${config.get('clogs.serverUrl')}`,
        data,
        {
          headers: {
            'Content-Type': contentType
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      return response.data;
    } catch (e) {
      // what to do here?
    }
  },

};

module.exports = clogsSvc;
