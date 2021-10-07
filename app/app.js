const compression = require('compression');
const config = require('config');
const cors = require('cors');
const express = require('express');
const Problem = require('api-problem');

const carboneCopyApi = require('./src/components/carboneCopyApi');
const keycloak = require('./src/components/keycloak');
const log = require('./src/components/log')(module.filename);
const httpLogger = require('./src/components/log').httpLogger;
const utils = require('./src/components/utils');
const v1Router = require('./src/routes/v1');
const v2Router = require('./src/routes/v2');

const { authorizedParty } = require('./src/middleware/authorizedParty');

// API statistics disabled
// const initializeApiTracker = require('./src/middleware/apiTracker');

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

// Print out configuration settings in verbose startup
log.verbose('Config', utils.prettyStringify(config));

// Skip if running tests
if (process.env.NODE_ENV !== 'test') {
  app.use(authorizedParty);
  app.use(httpLogger);

  // API statistics disabled
  // initializeApiTracker(app);

  // Initialize Carbone Copy Api
  carboneCopyApi.init();
  state.ready = true;
  log.info('Service ready to accept traffic');
}

// Use Keycloak OIDC Middleware
if (config.has('keycloak.enabled')) {
  app.use(keycloak.middleware());
}

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

// v2 Router
apiRouter.use('/v2', v2Router);

// Root level Router
app.use(/(\/api)?/, apiRouter);

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.stack) {
    log.error(err);
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
    log.error(err);
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
 * Shuts down this application after at least 5 seconds.
 */
function shutdown() {
  log.info('Received kill signal. Shutting down...');
  // Wait 5 seconds before starting cleanup
  if (!state.shutdown) setTimeout(cleanup, 5000);
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
