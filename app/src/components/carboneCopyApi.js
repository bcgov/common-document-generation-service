const config = require('config');
const mime = require('mime-types');
const path = require('path');
const Problem = require('api-problem');
const telejson = require('telejson');

const carboneRender = require('./carboneRender');
const FileCache = require('./fileCache');
const fileUpload = require('./upload');
const { truthy } = require('./utils');

const CACHE_DIR = config.get('carbone.cacheDir');
const CONVERTER_FACTORY_TIMEOUT = config.get('carbone.converterFactoryTimeout');
const UPLOAD_FIELD_NAME = config.get('carbone.formFieldName');
const UPLOAD_FILE_SIZE = config.get('carbone.uploadSize');
const UPLOAD_FILE_COUNT = config.get('carbone.uploadCount');
const START_CARBONE = config.get('carbone.startCarbone');

const DEFAULT_OPTIONS = {
  fileUploadsDir: CACHE_DIR,
  maxFileCount: UPLOAD_FILE_COUNT,
  maxFileSize: UPLOAD_FILE_SIZE,
  formFieldName: UPLOAD_FIELD_NAME,
  startCarbone: START_CARBONE,
  converterFactoryTimeout: CONVERTER_FACTORY_TIMEOUT
};

let fileCache;

module.exports = {
  init(options) {
    const _options = { ...DEFAULT_OPTIONS, ...options };

    fileCache = new FileCache({ fileCachePath: _options.fileUploadsDir });
    fileUpload.init();

    carboneRender.carboneSet();
  },

  findAndRender: (hash, req, res) => {
    const template = fileCache.find(hash);
    if (!template.success) {
      return new Problem(template.errorType, { detail: template.errorMsg }).send(res);
    } else {
      return this.renderTemplate(template, req, res);
    }
  },

  getFromCache: async (hash, hashHeaderName, download, remove, res) => {
    const file = fileCache.find(hash);
    if (!file.success) {
      return new Problem(file.errorType, { detail: file.errorMsg }).send(res);
    }

    let cached = undefined;
    if (download) {
      try {
        cached = await fileCache.read(hash);
      } catch (e) {
        return new Problem(500, { detail: e.message }).send(res);
      }
    }

    if (remove) {
      const removed = await fileCache.remove(hash);
      if (!removed.success) {
        return new Problem(removed.errorType, { detail: removed.errorMsg }).send(res);
      }
    }

    res.setHeader(hashHeaderName, file.hash);
    if (cached) {
      res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Content-Type', mime.contentType(path.extname(file.name)));
      res.setHeader('Content-Length', cached.length);
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
      return new Problem(400, { detail: 'options not provided or formatted incorrectly' }).send(res);
    }

    options.convertTo = options.convertTo || template.ext;
    if (options.convertTo.startsWith('.')) {
      options.convertTo = options.convertTo.slice(1);
    }

    options.reportName = options.reportName || `${path.parse(template.name).name}.${options.convertTo}`;
    // ensure the reportName has the same extension as the convertTo...
    if (options.convertTo !== path.extname(options.reportName).slice(1)) {
      options.reportName = `${path.parse(options.reportName).name}.${options.convertTo}`;
    }

    if (typeof data !== 'object' || data === null) {
      try {
        data = req.body.data;
      } catch (e) {
        return new Problem(400, { detail: 'data not provided or formatted incorrectly' }).send(res);
      }
    }

    try {
      formatters = telejson.parse(req.body.formatters);
      // eslint-disable-next-line no-empty
    } catch (e) {
    }

    const output = await carboneRender.render(template.path, data, options, formatters);
    if (output.success) {
      res.setHeader('Content-Disposition', `attachment; filename=${output.reportName}`);
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Content-Type', mime.contentType(path.extname(output.reportName)));
      res.setHeader('Content-Length', output.report.length);
      res.setHeader('X-Report-Name', output.reportName);
      res.setHeader('X-Template-Hash', template.hash);

      if (truthy('cacheReport', options)) {
        const rendered = await fileCache.write(output.report, output.reportName, 'binary');
        if (rendered.success) {
          res.setHeader('X-Report-Hash', rendered.hash);
        }
      }

      return res.send(output.report);
    } else {
      return new Problem(output.errorType, { detail: output.errorMsg }).send(res);
    }
  }
};
