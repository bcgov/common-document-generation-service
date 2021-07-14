const config = require('config');
const router = require('express').Router();
const { dump } = require('js-yaml');

const keycloak = require('../../components/keycloak');
const { getDocHTML, getSpec } = require('../../docs');

const docGenRouter = require('./docGen');
const fileTypesRouter = require('./fileTypes');
const healthRouter = require('./health');

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
router.get('/api-spec.json', (_req, res) => {
  res.status(200).json(getSpec(version));
});

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', (_req, res) => {
  console.log(version);
  res.status(200).type('application/yaml').send(dump(getSpec(version)));
});

/** OpenAPI Docs */
router.get('/docs', (_req, res) => {
  res.send(getDocHTML(version));
});

/** Doc Gen Router */
router.use('/docGen', keycloak.protect(`${clientId}:GENERATOR`), docGenRouter);

/** File Types Router */
router.use('/fileTypes', keycloak.protect(), fileTypesRouter);

/** Health Router */
router.use('/health', keycloak.protect(), healthRouter);

module.exports = router;
