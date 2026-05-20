const mime = require('mime-types');
const path = require('path');
const Problem = require('api-problem');
const telejson = require('telejson');

const log = require('./log')(module.filename);
const carboneRender = require('./carboneRender');
const carboneRenderService = require('./carboneRenderService');
const FileCache = require('./fileCache');
const {
  processTemplateOptions,
  setRenderResponseHeaders,
  handleRenderError,
} = require('../routes/shared/templateHelpers');

const fileCache = new FileCache();

const carboneCopyApi = {
  init() {
    carboneRender.carboneSet();
  },

  findAndRender: async (hash, req, res) => {
    const template = fileCache.find(hash);
    if (!template.success) {
      new Problem(template.errorType, { detail: template.errorMsg }).send(res);
    } else {
      return await carboneCopyApi.renderTemplate(template, req, res);
    }
  },

  /**
   * @function getFromCache
   * Attempts to fetch a specific file based off the sha-256 `hash` provided
   * @param {string} hash A sha-256 hash
   * @param {string} hashHeaderName The request header name for the hash
   * @param {boolean} download Determines whether to provide the file as a payload
   * @param {boolean} remove Determines whether to delete the file after the operation
   * @param {object} res Express response object
   */
  getFromCache: (hash, hashHeaderName, download, remove, res) => {
    const file = fileCache.find(hash);
    if (!file.success) {
      return new Problem(file.errorType, { detail: file.errorMsg }).send(res);
    }

    let cached = undefined;
    if (download) {
      try {
        cached = fileCache.read(hash);
      } catch (e) {
        return new Problem(500, { detail: e.message }).send(res);
      }
    }

    if (remove) {
      const removed = fileCache.remove(hash);
      if (!removed.success) {
        return new Problem(removed.errorType, {
          detail: removed.errorMsg,
        }).send(res);
      }
    }

    res.setHeader(hashHeaderName, file.hash);
    if (cached) {
      res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Content-Type', mime.contentType(path.extname(file.name)));
      res.setHeader('Content-Length', cached.length);
      log.info('Template found', { function: 'getFromCache' });
      return res.send(cached);
    } else {
      return res.sendStatus(200);
    }
  },

  renderTemplate: async (template, req, res) => {
    let data = req.body.data;
    let options = {};
    let formatters = {};

    try {
      options = req.body.options;
    } catch (e) {
      return new Problem(400, {
        detail: 'options not provided or formatted incorrectly',
      }).send(res);
    }

    const normalizedOptions = processTemplateOptions(
      options,
      template.ext,
      path.parse(template.name).name,
    );

    if (typeof data !== 'object' || data === null) {
      try {
        data = req.body.data;
      } catch (e) {
        return new Problem(400, {
          detail: 'data not provided or formatted incorrectly',
        }).send(res);
      }
    }

    formatters = {};

    try {
      formatters = telejson.parse(req.body.formatters);
      // TODO: Consider adding warning message to log
      // eslint-disable-next-line no-empty
    } catch (e) {}

    const output = await carboneRenderService.render(
      template.path,
      data,
      normalizedOptions,
      formatters,
    );
    if (output.success) {
      setRenderResponseHeaders(res, output.reportName, output.report);
      res.setHeader('X-Template-Hash', template.hash);

      log.info('Template rendered', { function: 'renderTemplate' });

      // log metrics
      log.verbose('Template rendered', {
        function: 'renderTemplate',
        metrics: { data: data, options: normalizedOptions, template: template },
      });

      return res.send(output.report);
    } else {
      return new Problem(output.errorType, handleRenderError(output)).send(res);
    }
  },
};

module.exports = carboneCopyApi;
