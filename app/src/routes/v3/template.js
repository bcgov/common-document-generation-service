const Problem = require('api-problem');
const config = require('config');
const carbone = require('carbone-sdk')(config.get('carbone.apiKey'));
const templateRouter = require('express').Router();

const { upload } = require('../../components/upload');
const log = require('../../components/log')(module.filename);

carbone.setApiVersion(5);
carbone.setOptions({
  carboneUrl: config.get('carbone.url'),
});

templateRouter.post('/', upload, async (req, res) => {
  log.verbose('Template upload');

  if (!req.file) {
    return new Problem(422, {
      detail: 'Template file is missing or malformed.',
    }).send(res);
  }

  try {
    const result = await carbone.addTemplatePromise(req.file.path);
    res.setHeader('X-Template-Hash', result);
    return res.send(result);
  } catch (err) {
    log.error(err);
    return new Problem(400, { detail: err.message }).send(res);
  }
});

/**
 * get a template from cache
 */
templateRouter.get('/:uid', async (req, res) => {
  const hash = req.params.uid;

  try {
    await carbone.getTemplatePromise(hash);
    res.sendStatus(200);
  } catch (err) {
    log.error(err);
    let statusCode = 400;
    switch (err.message) {
      case 'File not found': {
        statusCode = 404;
        break;
      }
    }
    return new Problem(statusCode, { detail: err.message }).send(res);
  }
});

/**
 * delete a template from cache
 */
templateRouter.delete('/:uid', async (req, res) => {
  const hash = req.params.uid;

  try {
    await carbone.getTemplatePromise(hash);
    await carbone.delTemplatePromise(hash);
    res.sendStatus(200);
  } catch (err) {
    log.error(err);
    let statusCode = 400;
    switch (err.message) {
      case 'File not found': {
        statusCode = 404;
        break;
      }
    }
    return new Problem(statusCode, { detail: err.message }).send(res);
  }
});

module.exports = templateRouter;
