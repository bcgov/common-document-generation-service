const helmet = require('helmet');

const fileTypesRouter = require('./fileTypes');
const healthRouter = require('./health');

const { authenticate } = require('../../middleware/authorization');
const {
  getDocs,
  getJsonSpec,
  getYamlSpec,
} = require('../../middleware/openapi');

/**
 * Create a versioned API router with shared configuration
 * @param {String} version - API version (e.g., 'v2', 'v3')
 * @param {Object} versionConfig - Version specific configuration
 * @param {Array} versionConfig.endpoints - List of endpoint definitions (name and operations)
 * @param {Object} versionConfig.templateRouter - Router for template-related endpoints
 * @returns {Object} Express router
 */
function createVersionedRouter(version, versionConfig) {
  const versionedRouter = require('express').Router();
  const { endpoints, templateRouter } = versionConfig;

  const docsHelmet = helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ['data:', 'https://cdn.redoc.ly'],
        'script-src': ['blob:', 'https://cdn.redoc.ly'],
      },
    },
  });

  // Base responder
  versionedRouter.get('/', (_req, res) => {
    res.status(200).json({ endpoints });
  });

  /** OpenAPI JSON Spec */
  versionedRouter.get('/api-spec.json', docsHelmet, getJsonSpec(version));

  /** OpenAPI YAML Spec */
  versionedRouter.get('/api-spec.yaml', docsHelmet, getYamlSpec(version));

  /** OpenAPI Docs */
  versionedRouter.get('/docs', docsHelmet, getDocs(version));

  /** File Types Router */
  versionedRouter.get('/fileTypes', authenticate, fileTypesRouter);

  /** Health Router */
  versionedRouter.use('/health', authenticate, healthRouter);

  /** Template Router */
  versionedRouter.use('/template', authenticate, templateRouter);

  return versionedRouter;
}

module.exports = createVersionedRouter;
