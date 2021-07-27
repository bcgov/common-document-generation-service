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
      { name: '/api-spec.json', operations: ['GET'] },
      { name: '/api-spec.yaml', operations: ['GET'] },
      { name: '/docs', operations: ['GET'] },
      { name: '/docGen', operations: ['POST'] },
      { name: '/fileTypes', operations: ['GET'] },
      { name: '/health', operations: ['GET'] }
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
