const Problem = require('api-problem');
const templateRouter = require('express').Router();

const { findAndRender, getFromCache } = require('../../components/carboneCopyApi');
const FileCache = require('../../components/fileCache');
const { upload } = require('../../components/upload');
const { truthy } = require('../../components/utils');
const { middleware } = require('../../components/validation');

/** Returns the rendered report from cache */
templateRouter.post('/template', upload, async (req, res) => {
  console.log('Template upload');

  const result = await FileCache.move(req.file.path, req.file.originalname);
  if (!result.success) {
    return new Problem(result.errorType, { detail: result.errorMsg }).send(res);
  } else {
    res.setHeader('X-Template-Hash', result.hash);
    return res.send(result.hash);
  }
});

templateRouter.post('/template/render', middleware.validateTemplate, async (req, res) => {
  console.log('Template upload and render');

  let template = {};
  try {
    template = { ...req.body.template };
    if (!template || !template.content) throw Error('Template content not provided.');
    if (!template.fileType) throw Error('Template file type not provided.');
    if (!template.encodingType) throw Error('Template encoding type not provided.');
  } catch (e) {
    return new Problem(400, { detail: e.message }).send(res);
  }

  // let the caller determine if they want to overwrite the template
  //
  const options = req.body.options || {};
  // write to disk...
  const content = await FileCache.write(template.content, template.fileType, template.encodingType, { overwrite: truthy('overwrite', options) });
  if (!content.success) {
    return new Problem(content.errorType, { detail: content.errorMsg }).send(res);
  }

  return await findAndRender(content.hash, req, res);
});

templateRouter.post('/template/:uid/render', middleware.validateCarbone, async (req, res) => {
  const hash = req.params.uid;
  console.log(`Template render ${hash}.`);
  return await findAndRender(hash, req, res);
});

templateRouter.get('/template/:uid', async (req, res) => {
  const hash = req.params.uid;
  const download = req.query.download !== undefined;
  const hashHeaderName = 'X-Template-Hash';
  console.log(`Get Template ${hash}. Download = ${download}`);
  return await getFromCache(hash, hashHeaderName, download, false, res);
});

templateRouter.delete('/template/:uid', async (req, res) => {
  const hash = req.params.uid;
  const download = req.query.download !== undefined;
  const hashHeaderName = 'X-Template-Hash';
  console.log(`Delete template: ${hash}. Download = ${download}`);
  return await getFromCache(hash, hashHeaderName, download, true, res);
});

module.exports = templateRouter;
