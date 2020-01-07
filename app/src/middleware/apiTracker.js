/**
 * @module ApiTracker
 *
 * Log statistics for CDOGS Requests.
 *
 * @see morgan
 *
 * @exports initializeApiTracker
 */
const moment = require('moment');
const morgan = require('morgan');

// this will suppress a console warning about moment deprecating a default fallback on non ISO/RFC2822 date formats
// we will just force it to use the new Date constructor.
moment.createFromInputFallback = function (config) {
  config._d = new Date(config._i);
};

const docGenUrl = '/api/v1/docGen';
const trackerUrls = [docGenUrl];

// add in any token (custom or morgan built-in) we want to the format, then morgan can parse out later
// status and response-time is a built-in morgan token
const apiTrackerFormat = ':op :azp :ts :contextKeyCount :contentFileType :contentEncodingType :contentSize :outputFileType :res[content-length] :status :response-time';

const apiTracker = async (req, res, next) => {

  if (trackerUrls.includes(req.url)) {
    req._ts = moment.utc().valueOf();
    req._op = req.url === docGenUrl ? 'DOCGEN' : 'Unknown';

    /*
    When/If we need to parse data out of the response, we would do it here...
    const defaultEnd = res.end;
    const chunks = [];
    res.end = (...restArgs) => {
        try {
            if (restArgs[0]) {
                chunks.push(Buffer.from(restArgs[0]));
            }
            const body = Buffer.concat(chunks).toString('utf8');
            const obj = JSON.parse(body);

        } catch (err) {
            log.error('mailApiTracker', err);
        }
        defaultEnd.apply(res, restArgs);
    };
    */
  }
  next();
};

const initializeApiTracker = app => {

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
      return countKeys(req.body.contexts);
    } catch (e) {
      return '0';
    }
  });

  morgan.token('contentFileType', req => {
    try {
      return req.body.template.contentFileType;
    } catch (e) {
      return '-';
    }
  });

  morgan.token('contentEncodingType', req => {
    try {
      return req.body.template.contentEncodingType;
    } catch (e) {
      return '-';
    }
  });

  morgan.token('contentSize', req => {
    try {
      const buf = Buffer.from(req.body.template.content, req.body.template.contentEncodingType);
      return buf.length;
    } catch (e) {
      return '0';
    }
  });

  morgan.token('outputFileType', req => {
    try {
      return req.body.template.outputFileType;
    } catch (e) {
      return '-';
    }
  });

  app.use(morgan(apiTrackerFormat, {
    // eslint-disable-next-line no-unused-vars
    skip: function (req, res) {
      return !trackerUrls.includes(req.baseUrl);
    },
    stream: {
      write: (s) => {
        if (s && s.trim().length) {
          const parts = s.trim().split(' ');
          const ts = Number.parseInt(parts[2]);
          // format this to match Kibana 2020-01-06T22:55:29.767054+00:00...
          const timestamp = moment.utc(ts).format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ');
          const o = {
            clogs: {
              type: 'CDOGS_API_TRACKER',
              ts: ts,
              timestamp: timestamp,
              level: 'info',
              data: {
                op: parts[0],
                azp: parts[1],
                context: {
                  keyCount: Number.parseInt(parts[3])
                },
                content: {
                  fileType: parts[4],
                  encodingType: parts[5],
                  size: Number.parseInt(parts[6])
                },
                output: {
                  fileType: parts[7],
                  size: '-' !== parts[8] ? Number.parseInt(parts[8]) : undefined
                },
                response: {
                  status: parts[9],
                  timeMs: Number.parseFloat(parts[10])
                }
              }
            }
          };
          // always print this directly to stdout
          // must be a single line of JSON only, Kibana can parse and we can query by clogs.* fields.
          process.stdout.write(`${JSON.stringify(o)}\n`);
        }
      }
    }
  }));

  app.use(apiTracker);

};

module.exports = initializeApiTracker;
