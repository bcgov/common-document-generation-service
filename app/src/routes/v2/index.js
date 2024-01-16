const router = require('express').Router();
const helmet = require('helmet');

const fileTypesRouter = require('./fileTypes');
const healthRouter = require('./health');
const templateRouter = require('./template');

const { protect } = require('../../middleware/authorization');
const { getDocs, getJsonSpec, getYamlSpec } = require('../../middleware/openapi');

const version = 'v2';
const docsHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      'img-src': ['data:', 'https://cdn.redoc.ly'],
      'script-src': ['blob:', 'https://cdn.redoc.ly']
    }
  }
});

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
router.get('/api-spec.json', docsHelmet, getJsonSpec(version));

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', docsHelmet, getYamlSpec(version));

/** OpenAPI Docs */
router.get('/docs', docsHelmet, getDocs(version));

/** File Types Router */
router.get('/fileTypes', protect(), fileTypesRouter);

/** Health Router */
router.use('/health', protect(), healthRouter);

/** Template Router */
router.use('/template', protect(), templateRouter);

module.exports = router;
