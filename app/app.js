const carbone = require('carbone');
const compression = require('compression');
const config = require('config');
const cors = require('cors');
const express = require('express');
const log = require('npmlog');
const morgan = require('morgan');
const Problem = require('api-problem');

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
  isShutdown: false
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
log.addLevel('debug', 1500, {
  fg: 'cyan'
});

// Print out configuration settings in verbose startup
log.verbose('Config', utils.prettyStringify(config));

// Skip if running tests
if (process.env.NODE_ENV !== 'test') {
  app.use(authorizedParty);
  initializeApiTracker(app);
  carboneCopyMiddleware.initializeApiTracker(app, carboneBasePath);
  // Add Morgan endpoint logging
  app.use(morgan(config.get('server.morganFormat')));
  // Initialize LibreOffice Factories
  carbone.set({ startFactory: true });
}

// Use Keycloak OIDC Middleware
app.use(keycloak.middleware());

// GetOK Base API Directory
apiRouter.get('/', (_req, res) => {
  if (state.isShutdown) {
    throw new Error('Server shutting down');
  } else {
    res.status(200).json({
      endpoints: [
        '/api/v1',
        carboneBasePath
      ],
      versions: [
        1
      ]
    });
  }
});

// v1 Router
apiRouter.use('/v1', v1Router);

// v2 - use carbone copy api..
// we are using routes() so we can use middleware, so the relative path for carbone-copy-api yaml spec isn't set.
// call to carbone-copy-api /docs will call /api-spec.yaml, let's redirect the call to the correct url
app.get('/api-spec.yaml', function(req, res){
  req.url = `${carboneBasePath}/api-spec.yaml`;
  app.handle(req, res);
});
app.use(carboneBasePath, carboneCopyMiddleware.operation(carboneBasePath), carboneCopyMiddleware.security, carboneCopyApi.routes());

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

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  if (err && err.stack) {
    log.error(err.stack);
  }
});

// Graceful shutdown support
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  log.info('Received kill signal. Shutting down...');
  state.isShutdown = true;
  // Wait 3 seconds before hard exiting
  setTimeout(() => process.exit(), 5000);
}

module.exports = app;
