const renderRouter = require('express').Router();
const { getFromCache, truthy } = require('../../components/carboneCopyApi');

/** Returns the rendered report from cache */
renderRouter.get('/:uid', (req, res) => {
  const hash = req.params.uid;
  const download = truthy('download', req.query);
  const hashHeaderName = 'X-Report-Hash';
  console.log(`Get Rendered report ${hash}. Download = ${download}`);
  return getFromCache(hash, hashHeaderName, download, false, res);
});

/** Deletes the rendered report from cache */
renderRouter.delete('/:uid', (req, res) => {
  const hash = req.params.uid;
  const download = truthy('download', req.query);
  const hashHeaderName = 'X-Report-Hash';
  console.log(`Delete rendered report: ${hash}. Download = ${download}`);
  return getFromCache(hash, hashHeaderName, download, true, res);
});

module.exports = renderRouter;
