const config = require('config');
const log = require('npmlog');
const moment = require('moment');
const morgan = require('morgan');
const path = require('path');

const keycloak = require('../components/keycloak');

const clientId = config.get('keycloak.clientId');

const operations = Object.freeze([
  {method: 'POST', regex: /\/template$/, name: 'UPLOAD_TEMPLATE', isGenerator: false},
  {method: 'POST', regex: /\/template\/\w+\/render/g, name: 'GENERATE_FROM_TEMPLATE', isGenerator: true},
  {method: 'POST', regex: /\/template\/render$/, name: 'GENERATE_FROM_UPLOAD', isGenerator: true},
  {method: 'GET', regex: /\/render/g, name: 'GET_OUTPUT', isGenerator: false},
  {method: 'GET', regex: /\/template\/(?!render)/g, name: 'GET_TEMPLATE', isGenerator: false}
]);

const getOperation = (req) => {
  const result = {isTrackable: false, isGenerator: false, name: null};
  if (!req) return result;

  operations.forEach(o => {
    if (!result.operation) {
      if (req.method === o.method && req.url.match(o.regex)) {
        result.name = o.name;
        result.isTrackable = true;
        result.isGenerator = o.isGenerator;
      }
    }
  });

  return result;
};

const apiFormat = ':op :azp :ts :status :response-time';
const generatorApiFormat = `${apiFormat} :outputFileType :contextKeyCount :contentFileType :contentEncodingType :contentSize :res[content-length]`;

const apiTracker = async (req, res, next) => {
  const operation = req._carboneOp;

  if (operation && operation.isTrackable) {
    req._ts = moment.utc().valueOf();
    req._op = operation.name;
  }
  next();
};

const apiTrackerParse = (msg) => {
  if (msg && msg.trim().length) {
    const parts = msg.trim().split(' ');

    const ms = Number.parseFloat(parts[4]);
    const s = ms / 1000;
    const roundedSeconds = Math.round(s * 10) / 10;

    let message = {
      type: 'api-tracker',
      timestamp: Number.parseInt(parts[2]),
      op: parts[0],
      azp: parts[1],
      response: {
        status: Number.parseInt(parts[3]),
        timeMs: s,
        seconds: roundedSeconds
      }
    };

    let extended = {};
    if (parts.length === 11) {
      const outputFileType = parts[5];
      const contextKeyCount = Number.parseInt(parts[6]);
      const contentFileType = parts[7];
      const contentEncodingType = parts[8];
      const contentSize = Number.parseInt(parts[9]);
      const contentLength = '-' !== parts[10] ? Number.parseInt(parts[10]) : undefined;
      extended = {
        context: {
          keyCount: contextKeyCount
        },
        content: {
          fileType: contentFileType,
          encodingType: contentEncodingType,
          size: contentSize
        },
        output: {
          fileType: outputFileType,
          size: contentLength
        }
      };
    }

    Object.assign(message, extended);
    return message;
  }
  return null;
};

const initializeApiTracker = (app, basePath) => {

  // register token parser functions.
  // this one would depend on authorizedParty middleware being loaded
  morgan.token('azp', req => {
    return req.authorizedParty ? req.authorizedParty : '-';
  });

  morgan.token('op', req => {
    return req._op ? req._op : '-';
  });

  morgan.token('ts', req => {
    return req._ts ? req._ts : '0';
  });

  morgan.token('contextKeyCount', req => {
    function countKeys(source) {
      if (!source) return 0;
      let result = 0;
      (function count(obj) {
        if (Array.isArray(obj)) {
          obj.forEach(function (j) {
            count(j);
          });
        } else {
          Object.keys(obj).forEach(function (k) {
            result++;
            const v = obj[k];
            if (typeof v === 'object') {
              count(v);
            }
          });
        }
      })(source);
      return result;
    }

    try {
      // want to return some idea of the size/magnitude/complexity of the contexts
      return countKeys(req.body.data);
    } catch (e) {
      return '0';
    }
  });

  morgan.token('contentFileType', req => {
    try {
      return req.body.template.fileType;
    } catch (e) {
      return '-';
    }
  });

  morgan.token('contentEncodingType', req => {
    try {
      return req.body.template.encodingType;
    } catch (e) {
      return '-';
    }
  });

  morgan.token('contentSize', req => {
    try {
      const buf = Buffer.from(req.body.template.content, req.body.template.encodingType);
      return buf.length;
    } catch (e) {
      return '0';
    }
  });

  morgan.token('outputFileType', req => {
    try {
      // convertTo is where we would expect the output file type, if not, try the desired output report name
      return req.body.options.convertTo ? req.body.options.convertTo : path.extname(req.body.options.reportName);
    } catch (e) {
      return '-';
    }
  });

  app.use(morgan(apiFormat, {
    // eslint-disable-next-line no-unused-vars
    skip: function (req, res) {
      const operation = req._carboneOp;
      return !operation || !operation.isTrackable || operation.isGenerator;
    },
    stream: {
      write: (s) => {
        const m = apiTrackerParse(s);
        if (m) {
          // write to stdout and let logging appliance pick it up
          // put the JSON string as a single line
          // cannot have the method name/group if we want to auto-convert to JSON in CLOGS
          log.info(JSON.stringify(m));
        }
      }
    }
  }));

  app.use(morgan(generatorApiFormat, {
    // eslint-disable-next-line no-unused-vars
    skip: function (req, res) {
      const operation = req._carboneOp;
      return !operation || !operation.isTrackable || !operation.isGenerator;
    },
    stream: {
      write: (s) => {
        const m = apiTrackerParse(s);
        if (m) {
          // write to stdout and let logging appliance pick it up
          // put the JSON string as a single line
          // cannot have the method name/group if we want to auto-convert to JSON in CLOGS
          log.info(JSON.stringify(m));
        }
      }
    }
  }));
  // need to call the operation middleware first, used in the apiTracker middleware
  app.use(operation(basePath));
  app.use(apiTracker);

};

const security = (req, res, next) => {
  const operation = req._carboneOp;
  if (operation) {
    if (operation.isGenerator) {
      return keycloak.protect(`${clientId}:GENERATOR`)(req, res, next);
    } else {
      return keycloak.protect()(req, res, next);
    }
  }
  next();
};

const operation = basePath => {
  return (req, res, next) => {
    if (!req._carboneOp && req.originalUrl.startsWith(basePath)) {
      const op = getOperation(req);
      req._carboneOp = op;
    }
    next();
  };
};

module.exports.initializeApiTracker = initializeApiTracker;
module.exports.operation = operation;
module.exports.security = security;





