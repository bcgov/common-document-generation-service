const config = require('config');
const router = require('express').Router();
const path = require('path');

const keycloak = require('../components/keycloak');

const checksRouter = require('./v1/checks');
const docGenRouter = require('./v1/docGen');
console.log(keycloak);

/** Base v1 Responder */
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/checks',
      '/docGen'
    ]
  });
});

/** OpenAPI Docs */
router.get('/docs', (_req, res) => {
  const docs = require('../docs/docs');
  res.send(docs.getDocHTML('v1'));
});

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../docs/v1.api-spec.yaml'));
});

/** Checks Router */
router.use('/checks', keycloak.protect(), checksRouter);

/** Doc Gen Router */
router.use('/docGen', keycloak.protect(`${config.get('keycloak.clientId')}:GENERATOR`), docGenRouter);

module.exports = router;
