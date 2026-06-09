const Problem = require('api-problem');
const templateRouter = require('express').Router();
const config = require('config');
const mime = require('mime-types');
const path = require('path');

const FileCache = require('../../components/fileCache');
const carboneSdkRender = require('../../components/carboneSdkRender');
const { upload } = require('../../components/upload');
const { truthy } = require('../../components/utils');
const { middleware } = require('../../components/validation');
const log = require('../../components/log')(module.filename);

const fileCache = new FileCache();

const withTrailingSlash = (url) => {
  if (!url) return url;
  return url.endsWith('/') ? url : `${url}/`;
};

const carbone = require('carbone-sdk')(
  process.env.CARBONE_API_KEY || config.get('carbone.apiKey'),
);
carbone.setApiVersion(5);
carbone.setOptions({
  carboneUrl: withTrailingSlash(config.get('carbone.url'))
});

log.info('initialized carbone v3 sdk engine for template routes', {
  function: 'v3/template'
});

const setRenderResponseHeaders = (res, reportName, report) => {
  res.setHeader('Content-Disposition', `attachment; filename=${reportName}`);
  res.setHeader('Content-Transfer-Encoding', 'binary');
  res.setHeader('Content-Type', mime.contentType(path.extname(reportName)) || 'application/octet-stream');
  res.setHeader('Content-Length', report.length);
  res.setHeader('X-Report-Name', reportName);
};

const normalizeOptions = (options, templateExt, templateName) => {
  const normalized = { ...options };
  normalized.convertTo = normalized.convertTo || templateExt;
  if (normalized.convertTo && normalized.convertTo.startsWith('.')) {
    normalized.convertTo = normalized.convertTo.slice(1);
  }

  normalized.reportName = normalized.reportName || `${path.parse(templateName || 'report').name}.${normalized.convertTo}`;
  if (normalized.convertTo !== path.extname(normalized.reportName).slice(1)) {
    normalized.reportName = `${path.parse(normalized.reportName).name}.${normalized.convertTo}`;
  }

  return normalized;
};

/**
 *  Upload a template to cache
 */
templateRouter.post('/', upload, async (req, res) => {
  log.verbose('Template upload');

  if (!req.file) {
    return new Problem(422, {
      detail: 'Template file is missing or malformed.'
    }).send(res);
  }

  const result = await fileCache.move(req.file.path, req.file.originalname);
  if (!result.success) {
    return new Problem(result.errorType, {
      detail: result.errorMsg,
      hash: result.hash
    }).send(res);
  }

  res.setHeader('X-Template-Hash', result.hash);
  return res.send(result.hash);
});

/**
 * Render a document from a template provided in JSON body
 */
templateRouter.post('/render', middleware.validateTemplate, async (req, res) => {
  log.verbose('Template upload and render');

  let template = {};
  try {
    template = { ...req.body.template };
    if (!template || !template.content) throw Error('Template content not provided.');
    if (!template.fileType) throw Error('Template file type not provided.');
    if (!template.encodingType) throw Error('Template encoding type not provided.');
  } catch (e) {
    return new Problem(400, { detail: e.message }).send(res);
  }

  const options = req.body.options || {};
  const contentResult = await fileCache.write(
    template.content,
    template.fileType,
    template.encodingType,
    { overwrite: truthy('overwrite', options) }
  );
  if (!contentResult.success) {
    return new Problem(contentResult.errorType, { detail: contentResult.errorMsg }).send(res);
  }

  const content = fileCache.find(contentResult.hash);
  if (!content.success) {
    return new Problem(content.errorType, { detail: content.errorMsg }).send(res);
  }

  const normalizedOptions = normalizeOptions(options, content.ext, content.name);
  let formatters = {};
  if (req.body.formatters) {
    try {
      formatters = require('telejson').parse(req.body.formatters, { allowFunction: true });
    } catch (error) {
      return new Problem(422, { detail: 'Formatters could not be parsed into formatters object.' }).send(res);
    }
  }

  try {
    const output = await carboneSdkRender.render(carbone, content.path, req.body.data, normalizedOptions, formatters);
    if (output.success) {
      setRenderResponseHeaders(res, output.reportName, output.report);
      res.setHeader('X-Template-Hash', content.hash);
      return res.send(output.report);
    }

    return new Problem(output.errorType, { detail: output.errorMsg }).send(res);
  } catch (err) {
    log.error(err);
    return new Problem(500, { detail: err.message }).send(res);
  }
});

/**
 * Render a document from a cached template
 */
templateRouter.post('/:uid/render', middleware.validateCarbone, async (req, res) => {
  const hash = req.params.uid;
  log.verbose('Template render', { hash });

  const template = fileCache.find(hash);
  if (!template.success) {
    return new Problem(template.errorType, {
      detail: template.errorMsg
    }).send(res);
  }

  const options = req.body.options || {};
  const normalizedOptions = normalizeOptions(options, template.ext, template.name);
  let formatters = {};
  if (req.body.formatters) {
    try {
      formatters = require('telejson').parse(req.body.formatters, { allowFunction: true });
    } catch (error) {
      return new Problem(422, { detail: 'Formatters could not be parsed into formatters object.' }).send(res);
    }
  }

  try {
    const output = await carboneSdkRender.render(carbone, template.path, req.body.data, normalizedOptions, formatters);
    if (output.success) {
      setRenderResponseHeaders(res, output.reportName, output.report);
      res.setHeader('X-Template-Hash', template.hash);
      return res.send(output.report);
    }

    return new Problem(output.errorType, { detail: output.errorMsg }).send(res);
  } catch (err) {
    log.error(err);
    return new Problem(500, { detail: err.message }).send(res);
  }
});

/**
 * get a template from cache
 */
templateRouter.get('/:uid', async (req, res) => {
  const hash = req.params.uid;

  const file = fileCache.find(hash);
  if (!file.success) {
    return new Problem(file.errorType, {
      detail: file.errorMsg
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
      detail: removed.errorMsg
    }).send(res);
  }

  return res.sendStatus(200);
});

module.exports = templateRouter;
