const Problem = require('api-problem');
const config = require('config');
const templateRouter = require('express').Router();

const FileCache = require('../../components/fileCache');
const { upload } = require('../../components/upload');
const { truthy } = require('../../components/utils');
const { middleware } = require('../../components/validation');
const carboneRenderService = require('../../components/carboneRenderService');
const {
  processTemplateOptions,
  setRenderResponseHeaders,
  handleRenderError,
} = require('../shared/templateHelpers');
const log = require('../../components/log')(module.filename);

const fileCache = new FileCache();

// initialize carbone-sdk (v3) engine
const carbone = require('carbone-sdk')(
  process.env.CARBONE_API_KEY || config.get('carbone.apiKey'),
);
carbone.setApiVersion(5);
carbone.setOptions({
  carboneUrl: config.get('carbone.url'),
});
log.info('initialized carbone v3 sdk engine for routes', {
  function: 'v3/template',
});

templateRouter.post('/', upload, async (req, res) => {
  log.verbose('Template upload');

  if (!req.file) {
    return new Problem(422, {
      detail: 'Template file is missing or malformed.',
    }).send(res);
  }

  const result = await fileCache.move(req.file.path, req.file.originalname);
  if (!result.success) {
    return new Problem(result.errorType, {
      detail: result.errorMsg,
      hash: result.hash,
    }).send(res);
  } else {
    res.setHeader('X-Template-Hash', result.hash);
    return res.send(result.hash);
  }
});

/**
 * Render a document from a template provided in JSON body
 */
templateRouter.post(
  '/render',
  middleware.validateTemplate,
  async (req, res) => {
    log.verbose('Template upload and render');

    let template = {};
    try {
      template = { ...req.body.template };
      if (!template || !template.content)
        throw Error('Template content not provided.');
      if (!template.fileType) throw Error('Template file type not provided.');
      if (!template.encodingType)
        throw Error('Template encoding type not provided.');
    } catch (e) {
      return new Problem(400, { detail: e.message }).send(res);
    }

    // let the caller determine if they want to overwrite the template
    const options = req.body.options || {};
    // write to disk...
    const hash = await fileCache.write(
      template.content,
      template.fileType,
      template.encodingType,
      { overwrite: truthy('overwrite', options) },
    );
    const content = await fileCache.find(hash.hash);
    // Process and normalize options
    const normalizedOptions = processTemplateOptions(options, content.ext);

    try {
      const output = await carboneRenderService.render(
        carbone,
        content.path,
        req.body.data,
        normalizedOptions,
        true,
      );
      if (output.success) {
        setRenderResponseHeaders(res, output.reportName, output.report);
        return res.send(output.report);
      } else {
        return new Problem(output.errorType, handleRenderError(output)).send(
          res,
        );
      }
    } catch (err) {
      log.error(err);
      return new Problem(500, { detail: err.message }).send(res);
    }
  },
);

/**
 * Render a document from a cached template
 */
templateRouter.post(
  '/:uid/render',
  middleware.validateCarbone,
  async (req, res) => {
    const hash = req.params.uid;
    log.verbose('Template render', { hash: hash });

    const template = fileCache.find(hash);
    if (!template.success) {
      return new Problem(template.errorType, {
        detail: template.errorMsg,
      }).send(res);
    }

    const options = req.body.options || {};
    // Process and normalize options
    const normalizedOptions = processTemplateOptions(options, template.ext);

    try {
      const output = await carboneRenderService.render(
        carbone,
        template.path,
        req.body.data,
        normalizedOptions,
        true,
      );
      if (output.success) {
        setRenderResponseHeaders(res, output.reportName, output.report);
        return res.send(output.report);
      } else {
        return new Problem(output.errorType, handleRenderError(output)).send(
          res,
        );
      }
    } catch (err) {
      log.error(err);
      return new Problem(500, { detail: err.message }).send(res);
    }
  },
);

/**
 * get a template from cache
 */
templateRouter.get('/:uid', async (req, res) => {
  const hash = req.params.uid;

  const file = fileCache.find(hash);
  if (!file.success) {
    return new Problem(file.errorType, {
      detail: file.errorMsg,
    }).send(res);
  }

  res.setHeader('X-Template-Hash', file.hash);
  return res.sendStatus(200);
});

/**
 * delete a template from cache
 */
templateRouter.delete('/:uid', async (req, res) => {
  const hash = req.params.uid;

  const removed = fileCache.remove(hash);
  if (!removed.success) {
    return new Problem(removed.errorType, {
      detail: removed.errorMsg,
    }).send(res);
  }

  return res.sendStatus(200);
});

module.exports = templateRouter;
