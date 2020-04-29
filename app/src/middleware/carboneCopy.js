const bytes = require('bytes');
const config = require('config');
const log = require('npmlog');
const moment = require('moment');
const morgan = require('morgan');
const path = require('path');

const fileCacheUtils = require('../components/fileCacheUtils');
const keycloak = require('../components/keycloak');

const clientId = config.get('keycloak.clientId');

const _CACHE_DIR = process.env.CACHE_DIR || '/tmp/carbone-files';
const _DEFAULT_CACHE_SIZE = bytes.parse('50MB');
//ugh, translating between openshift configurations for PVC and bytes parsing.... :|
let _CACHE_SIZE = _DEFAULT_CACHE_SIZE;
if (process.env.CACHE_SIZE) {
  if (process.env.CACHE_SIZE.toUpperCase().endsWith('B')) {
    _CACHE_SIZE =  bytes.parse(process.env.CACHE_SIZE) ;
  } else {
    _CACHE_SIZE =  bytes.parse(`${process.env.CACHE_SIZE}B`) ;
  }
  if (_CACHE_SIZE === undefined || isNaN(_CACHE_SIZE)) {
    _CACHE_SIZE = _DEFAULT_CACHE_SIZE;
  }
}
if (_CACHE_SIZE < _DEFAULT_CACHE_SIZE) {
  log.warn('carboneCopy.middleware', `Cache size (${bytes.format(_CACHE_SIZE, {unit: 'MB'})}) is smaller than default (${bytes.format(_DEFAULT_CACHE_SIZE, {unit: 'MB'})}), check environment variable CACHE_SIZE (${process.env.CACHE_SIZE}).`);
}

const operations = Object.freeze([
  {method: 'POST', regex: /\/template$/, name: 'UPLOAD_TEMPLATE', isGenerator: false},
  {method: 'POST', regex: /\/template\/\w+\/render/g, name: 'GENERATE_FROM_TEMPLATE', isGenerator: true},
  {method: 'POST', regex: /\/template\/render$/, name: 'GENERATE_FROM_UPLOAD', isGenerator: true},
  {method: 'GET', regex: /\/render/g, name: 'GET_OUTPUT', isGenerator: false},
  {method: 'GET', regex: /\/template\/(?!render)/g, name: 'GET_TEMPLATE', isGenerator: false},
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

    const extended = {};
    if (parts.length === 11) {
      extended.context = {
        keyCount: Number.parseInt(parts[6])
      };
      extended.content = {
        fileType: parts[7],
        encodingType: parts[8],
        size: Number.parseInt(parts[9])
      };
      extended.output = {
        fileType: parts[5],
        size: '-' !== parts[10] ? Number.parseInt(parts[10]) : undefined
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
  // allow docs and the api spec to be accessible by non-authenticated users.
  // everything else should be authenticated
  if (!['/docs','/api-spec.yaml'].includes(req.url)) {
    const operation = req._carboneOp;
    if (operation) {
      if (operation.isGenerator) {
        // authenticated AND has specific role...
        return keycloak.protect(`${clientId}:GENERATOR`)(req, res, next);
      } else {
        // authenticated, no specific role privileges.
        return keycloak.protect()(req, res, next);
      }
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

const cacheCleanup = (req, res, next) => {
  res.on('finish', function(){
    // check if we are at our threshold (90% of capacity)
    // if yes, remove oldest file in cache...
    // cache location AND size must be defined in env vars...
    let storedFiles = fileCacheUtils.getAllFiles(_CACHE_DIR);
    let storedSize = fileCacheUtils.getTotalSize(storedFiles);
    while (storedSize >= (_CACHE_SIZE * 0.9)) {
      // let's start purging...
      if (fileCacheUtils.removeOldest(storedFiles, _CACHE_DIR)) {
        storedFiles = fileCacheUtils.getAllFiles(_CACHE_DIR);
        storedSize = fileCacheUtils.getTotalSize(storedFiles);
      }
    }
  });
  next();
};

module.exports.initializeApiTracker = initializeApiTracker;
module.exports.operation = operation;
module.exports.security = security;
module.exports.cacheCleanup = cacheCleanup;
