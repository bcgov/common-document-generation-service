const carbone = require('carbone');
const compression = require('compression');
const config = require('config');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const log = require('npmlog');
const morgan = require('morgan');
const Problem = require('api-problem');
const Writable = require('stream').Writable;

const keycloak = require('./src/components/keycloak');
const utils = require('./src/components/utils');
const v1Router = require('./src/routes/v1');

const { authorizedParty } = require('./src/middleware/authorizedParty');
const initializeApiTracker = require('./src/middleware/apiTracker');

const carboneCopyApi = require('@bcgov/carbone-copy-api');
const carboneCopyMiddleware = require('./src/middleware/carboneCopy');
const carboneBasePath = '/api/v2';

const apiRouter = express.Router();
const state = {
  ready: false,
  shutdown: false
};

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json({
  limit: config.get('server.bodyLimit')
}));
app.use(express.urlencoded({
  extended: false
}));

// Logging Setup
log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, { fg: 'cyan' });

let logFileStream;
let teeStream;
if (config.has('server.logFile')) {
  // Write to logFile in append mode
  logFileStream = fs.createWriteStream(config.get('server.logFile'), { flags: 'a' });
  teeStream = new Writable({
    objectMode: true,
    write: (data, _, done) => {
      process.stdout.write(data);
      logFileStream.write(data);
      done();
    }
  });
  log.disableColor();
  log.stream = teeStream;
}

// Print out configuration settings in verbose startup
log.verbose('Config', utils.prettyStringify(config));

// Skip if running tests
if (process.env.NODE_ENV !== 'test') {
  app.use(authorizedParty);
  initializeApiTracker(app);
  carboneCopyMiddleware.initializeApiTracker(app, carboneBasePath);
  // Add Morgan endpoint logging
  const morganOpts = {
    // Skip logging kube-probe requests
    skip: (req) => req.headers['user-agent'] && req.headers['user-agent'].includes('kube-probe')
  };
  if (config.has('server.logFile')) {
    morganOpts.stream = teeStream;
  }
  app.use(morgan(config.get('server.morganFormat'), morganOpts));
  // Initialize LibreOffice Factories
  carbone.set({ startFactory: true });
  log.info('Carbone LibreOffice worker initialized');
  state.ready = true;
  log.info('Service ready to accept traffic');
}

// Use Keycloak OIDC Middleware
app.use(keycloak.middleware());

// Block requests until service is ready and mounted
app.use((_req, res, next) => {
  if (state.shutdown) {
    new Problem(503, { details: 'Server is shutting down' }).send(res);
  } else if (!state.ready) {
    new Problem(503, { details: 'Server is not ready' }).send(res);
  } else {
    next();
  }
});

// CDOGS Base API Directory
apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/api/v1',
      '/api/v2'
    ],
    versions: [
      1,
      2
    ]
  });
});

// v1 Router
apiRouter.use('/v1', v1Router);

// v2 - use carbone copy api..
// we are using routes() so we can use middleware, so the relative path for carbone-copy-api yaml spec isn't set.
// call to carbone-copy-api /docs will call /api-spec.yaml, let's redirect the call to the correct url
app.get('/api-spec.yaml', (req, res) => {
  req.url = `${carboneBasePath}/api-spec.yaml`;
  app.handle(req, res);
});
app.use(carboneBasePath, carboneCopyMiddleware.operation(carboneBasePath), carboneCopyMiddleware.security, carboneCopyMiddleware.cacheCleanup, carboneCopyApi.routes());

// Root level Router
app.use(/(\/api)?/, apiRouter);

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.stack) {
    log.error(err.stack);
  }

  if (err instanceof Problem) {
    err.send(res);
  } else {
    new Problem(500, {
      details: (err.message) ? err.message : err
    }).send(res);
  }
});

// Handle 404
app.use((_req, res) => {
  new Problem(404).send(res);
});

// Prevent unhandled promise errors from crashing application
process.on('unhandledRejection', err => {
  if (err && err.stack) {
    log.error(err.stack);
  }
});

// Graceful shutdown support
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR1', shutdown);
process.on('SIGUSR2', shutdown);
process.on('exit', () => {
  log.info('Exiting...');
});

/**
 * @function shutdown
 * Shuts down this application after at least 3 seconds.
 */
function shutdown() {
  log.info('Received kill signal. Shutting down...');
  // Wait 3 seconds before starting cleanup
  if (!state.shutdown) setTimeout(cleanup, 3000);
}

/**
 * @function cleanup
 * Cleans up resources in this application.
 */
function cleanup() {
  log.info('Service no longer accepting traffic');
  state.shutdown = true;
  // Wait 10 seconds max before hard exiting
  setTimeout(() => process.exit(), 10000);
}

module.exports = app;
