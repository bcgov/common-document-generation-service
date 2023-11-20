const compression = require('compression');
const config = require('config');
const cors = require('cors');
const express = require('express');
const Problem = require('api-problem');

const { name: appName, version: appVersion } = require('./package.json');
const carboneCopyApi = require('./src/components/carboneCopyApi');
const keycloak = require('./src/components/keycloak');
const log = require('./src/components/log')(module.filename);
const httpLogger = require('./src/components/log').httpLogger;
const { getGitRevision, prettyStringify } = require('./src/components/utils');
const v2Router = require('./src/routes/v2');

const { authorizedParty } = require('./src/middleware/authorizedParty');

const apiRouter = express.Router();
const state = {
  gitRev: getGitRevision(),
  ready: false,
  shutdown: false
};

const app = express();
app.use(compression());
app.use(cors({
  /** Tells browsers to cache preflight requests for Access-Control-Max-Age seconds */
  maxAge: 600,
  /** Set true to dynamically set Access-Control-Allow-Origin based on Origin */
  origin: true
}));
app.use(express.json({
  limit: config.get('server.bodyLimit')
}));
app.use(express.urlencoded({
  extended: false
}));

// Print out configuration settings in verbose startup
log.verbose('Config', prettyStringify(config));

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
  log.info('Running in authenticated mode');
  app.use(keycloak.middleware());
} else {
  log.info('Running in public mode');
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

// Base API Directory
apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    app: {
      gitRev: state.gitRev,
      name: appName,
      nodeVersion: process.version,
      version: appVersion
    },
    endpoints: ['/api/v2'],
    versions: [2]
  });
});

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
  // Wait 5 seconds max before hard exiting
  setTimeout(() => process.exit(), 5000);
}

module.exports = app;
