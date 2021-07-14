const router = require('express').Router();
const { dump } = require('js-yaml');

const { getDocHTML, getSpec } = require('../../docs');

const fileTypesRouter = require('./fileTypes');
const healthRouter = require('./health');
const renderRouter = require('./render');
const templateRouter = require('./template');

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
router.get('/api-spec.json', (_req, res) => {
  res.status(200).json(getSpec(version));
});

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', (_req, res) => {
  res.status(200).type('application/yaml').send(dump(getSpec(version)));
});

/** OpenAPI Docs */
router.get('/docs', (_req, res) => {
  res.send(getDocHTML(version));
});

/** File Types Router */
router.get('/fileTypes', fileTypesRouter);

/** Health Router */
router.use('/health', healthRouter);

/** Render Router */
router.use('/render', renderRouter);

/** Template Router */
router.use('/template', templateRouter);

module.exports = router;
