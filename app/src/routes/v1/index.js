const config = require('config');
const router = require('express').Router();

const docGenRouter = require('./docGen');
const fileTypesRouter = require('./fileTypes');
const healthRouter = require('./health');

const { protect } = require('../../middleware/authorization');
const { getDocs, getJsonSpec, getYamlSpec } = require('../../middleware/openapi');

const clientId = config.get('keycloak.clientId');
const version = 'v1';

/** Base Responder */
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/docGen',
      '/fileTypes',
      '/health'
    ]
  });
});

/** OpenAPI JSON Spec */
router.get('/api-spec.json', getJsonSpec(version));

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', getYamlSpec(version));

/** OpenAPI Docs */
router.get('/docs', getDocs(version));

/** Doc Gen Router */
router.use('/docGen', protect(`${clientId}:GENERATOR`), docGenRouter);

/** File Types Router */
router.use('/fileTypes', protect(), fileTypesRouter);

/** Health Router */
router.use('/health', protect(), healthRouter);

module.exports = router;
