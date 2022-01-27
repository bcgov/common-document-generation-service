const renderRouter = require('express').Router();
const { getFromCache } = require('../../components/carboneCopyApi');
const { truthy } = require('../../components/utils');
const log = require('../../components/log')(module.filename);

/** Returns the rendered report from cache */
renderRouter.get('/:uid', (req, res) => {
  const hash = req.params.uid;
  const download = truthy('download', req.query);
  const hashHeaderName = 'X-Report-Hash';
  log.info('Get rendered report', { hash: hash, download: download });

  return getFromCache(hash, hashHeaderName, download, false, res);
});

/** Deletes the rendered report from cache */
renderRouter.delete('/:uid', (req, res) => {
  const hash = req.params.uid;
  const download = truthy('download', req.query);
  const hashHeaderName = 'X-Report-Hash';
  log.info('Delete rendered report', { hash: hash, download: download });

  return getFromCache(hash, hashHeaderName, download, true, res);
});

module.exports = renderRouter;
