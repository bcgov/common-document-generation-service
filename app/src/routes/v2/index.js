const router = require('express').Router();

const fileTypesRouter = require('./fileTypes');
const healthRouter = require('./health');
const renderRouter = require('./render');
const templateRouter = require('./template');

const { getDocs, getJsonSpec, getYamlSpec } = require('../../middleware/openapi');

const version = 'v2';

// Base Responder
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      { name: '/api-spec.json', operations: ['GET'] },
      { name: '/api-spec.yaml', operations: ['GET'] },
      { name: '/docs', operations: ['GET'] },
      { name: '/fileTypes', operations: ['GET'] },
      { name: '/health', operations: ['GET'] },
      { name: '/render/{id}', operations: ['GET', 'DELETE'] },
      { name: '/template', operations: ['POST'] },
      { name: '/template/render', operations: ['POST'] },
      { name: '/template/{id}', operations: ['GET', 'DELETE'] },
      { name: '/template/{id}/render', operations: ['POST'] }
    ]
  });
});

/** OpenAPI JSON Spec */
router.get('/api-spec.json', getJsonSpec(version));

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', getYamlSpec(version));

/** OpenAPI Docs */
router.get('/docs', getDocs(version));

/** File Types Router */
router.get('/fileTypes', fileTypesRouter);

/** Health Router */
router.use('/health', healthRouter);

/** Render Router */
router.use('/render', renderRouter);

/** Template Router */
router.use('/template', templateRouter);

module.exports = router;
