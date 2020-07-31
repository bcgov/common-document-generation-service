const bytes = require('bytes');
const config = require('config');
const log = require('npmlog');
const moment = require('moment');
const morgan = require('morgan');
const path = require('path');

const fileCacheUtils = require('../components/fileCacheUtils');
const keycloak = require('../components/keycloak');

const clientId = config.get('keycloak.clientId');

const _CACHE_DIR = config.get('carbone.cacheDir');
const _DEFAULT_CACHE_SIZE = bytes.parse('25MB');
const _MIN_CACHE_SIZE = bytes(config.get('carbone.uploadSize'));
const configuredCacheSize = config.get('carbone.cacheSize');
let _CACHE_SIZE = _DEFAULT_CACHE_SIZE;
if (configuredCacheSize) {
  _CACHE_SIZE =  bytes.parse(configuredCacheSize);
  if (_CACHE_SIZE === undefined || isNaN(_CACHE_SIZE)) {
    _CACHE_SIZE = _DEFAULT_CACHE_SIZE;
  }
}
if (_CACHE_SIZE < _DEFAULT_CACHE_SIZE) {
  log.warn('carboneCopy.middleware', `Cache size (${bytes.format(_CACHE_SIZE, {unit: 'MB'})}) is smaller than default (${bytes.format(_DEFAULT_CACHE_SIZE, {unit: 'MB'})}), check environment variable CACHE_SIZE (${configuredCacheSize}).`);
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

        // if operation name is 'GENERATE_FROM_TEMPLATE' (using an existing tenmplate), get template hash
        // if(o.name == 'GENERATE_FROM_TEMPLATE'){
        //   result.existingTemplateFileType = req.body.template.fileType;
        // }
        // else{
        //   result.existingTemplateFileType = null;
        // }

        //console.log('keys',Object.keys(req.body));
        //console.log('ok', Object.keys(req.body.template));

      }
    }
  });

  //console.log(result);

  return result;
};

const apiFormat = ':op :azp :ts :status :response-time';
const generatorApiFormat = `${apiFormat} :outputFileType :contextKeyCount :contentFileType :existingTemplate :contentEncodingType :contentSize :res[content-length]`;

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
    if (parts.length === 12) {
      extended.context = {
        keyCount: Number.parseInt(parts[6])
      };
      extended.content = {
        fileType: parts[7],
        existingTemplate: parts[8],
        encodingType: parts[9],
        size: Number.parseInt(parts[10])
      };
      extended.output = {
        fileType: parts[5],
        size: '-' !== parts[11] ? Number.parseInt(parts[11]) : undefined
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

  morgan.token('existingTemplate', req => {
    try {

      //console.log('req.body',Object.keys(req.body));
      //console.log('existingTemplate', req.body.template.content);

      return req.body.template.content;
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

const cacheCleanup = async (req, res, next) => {
  try {
    await fileCacheUtils.cacheCleanup(_CACHE_DIR, _CACHE_SIZE, _MIN_CACHE_SIZE);
  } catch(e) {
    log.error('carboneCopy.cacheCleanup', e.message);
  }
  next();
};

module.exports.initializeApiTracker = initializeApiTracker;
module.exports.operation = operation;
module.exports.security = security;
module.exports.cacheCleanup = cacheCleanup;
