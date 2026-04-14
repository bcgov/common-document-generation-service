const Problem = require('api-problem');
const config = require('config');
const carbone = require('carbone-sdk')(config.get('carbone.apiKey'));
const templateRouter = require('express').Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FileCache = require('../../components/fileCache');
const { upload } = require('../../components/upload');
const { truthy } = require('../../components/utils');
const log = require('../../components/log')(module.filename);

const fileCache = new FileCache();

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
 * Render a document from a template provided in JSON body
 */
templateRouter.post('/render', async (req, res) => {
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
  // some defaults if options not set...
  if (!options.convertTo || !options.convertTo.trim().length) {
    // set convert to template type (no conversion)
    options.convertTo = path.extname(template).slice(1);
  }
  if (!options.reportName || !options.reportName.trim().length) {
    // no report name, set to UUID
    options.reportName = `${uuidv4()}.${options.convertTo}`;
  }

  // ensure the reportName has the same extension as the convertTo...
  if (options.convertTo !== path.extname(options.reportName).slice(1)) {
    options.reportName = `${path.parse(options.reportName).name}.${options.convertTo}`;
  }

  try {
    const renderResult = await carbone.renderPromise(content.path, {
      data: req.body.data,
      ...options,
    });
    const result = {
      report: renderResult.content,
      reportName: renderResult.filename,
      success: true,
    };
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${result.reportName}`,
    );
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', result.report.length);
    res.setHeader('X-Report-Name', result.reportName);
    return res.send(result.report);
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
 * Render a document from a cached template
 */
templateRouter.post('/:uid/render', async (req, res) => {
  const hash = req.params.uid;
  log.verbose('Template render', { hash: hash });

  try {
    const renderResult = await carbone.renderPromise(hash, {
      data: req.body.data,
      ...req.body.options,
    });
    const result = {
      report: renderResult.content,
      reportName: renderResult.filename,
      success: true,
    };
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${result.reportName}`,
    );
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', result.report.length);
    res.setHeader('X-Report-Name', result.reportName);
    return res.send(result.report);
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
