const router = require('express').Router();

const mime = require('mime-types');
const path = require('path');
const Problem = require('api-problem');
const telejson = require('telejson');

const carboneRenderer = require('./carboneRender');
const FileCache = require('./fileCache');
const fileUpload = require('./upload');
const validation = require('./validation');
const { isString } = require('./utils');

const CACHE_DIR = process.env.CACHE_DIR || '/tmp/carbone-files';
const CONVERTER_FACTORY_TIMEOUT = process.env.CONVERTER_FACTORY_TIMEOUT || '60000';
const UPLOAD_FIELD_NAME = process.env.UPLOAD_FIELD_NAME || 'template';
const UPLOAD_FILE_SIZE = process.env.UPLOAD_FILE_SIZE || '25MB';
const UPLOAD_FILE_COUNT = process.env.UPLOAD_FILE_COUNT || '1';
const START_CARBONE = process.env.START_CARBONE || 'true';

const DEFAULT_OPTIONS = {
  fileUploadsDir: CACHE_DIR,
  maxFileCount: UPLOAD_FILE_COUNT,
  maxFileSize: UPLOAD_FILE_SIZE,
  formFieldName: UPLOAD_FIELD_NAME,
  startCarbone: START_CARBONE,
  converterFactoryTimeout: CONVERTER_FACTORY_TIMEOUT
};

let fileCache;
let mountPath = '/';

const truthy = (name, obj = {}) => {
  const value = obj[name] || false;
  return (value === 'true' || value === '1' || value === 'yes' || value === 'y' || value === 't' || value === 1 || value === true);
};

const renderTemplate = async (template, req, res) => {
  let data = req.body.data;
  let options = {};
  let formatters = {};

  try {
    options = req.body.options;
  } catch (e) {
    return new Problem(400, {detail: 'options not provided or formatted incorrectly'}).send(res);
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
      return new Problem(400, {detail: 'data not provided or formatted incorrectly'}).send(res);
    }
  }

  try {
    formatters = telejson.parse(req.body.formatters);
    // eslint-disable-next-line no-empty
  } catch (e) {
  }

  const output = await carboneRenderer.render(template.path, data, options, formatters);
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
    return new Problem(output.errorType, {detail: output.errorMsg}).send(res);
  }
};

const getFromCache = async (hash, hashHeaderName, download, remove, res) => {
  const file = fileCache.find(hash);
  if (!file.success) {
    return new Problem(file.errorType, {detail: file.errorMsg}).send(res);
  }

  let cached = undefined;
  if (download) {
    try {
      cached = await fileCache.read(hash);
    } catch (e) {
      return new Problem(500, {detail: e.message}).send(res);
    }
  }

  if (remove) {
    const removed = await fileCache.remove(hash);
    if (!removed.success) {
      return new Problem(removed.errorType, {detail: removed.errorMsg}).send(res);
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
};

const findAndRender = async (hash, req, res) => {
  const template = fileCache.find(hash);
  if (!template.success) {
    return new Problem(template.errorType, {detail: template.errorMsg}).send(res);
  } else {
    return await renderTemplate(template, req, res);
  }
};

router.post('/template', fileUpload.upload, async (req, res) => {
  console.log('Template upload');

  const result = await fileCache.move(req.file.path, req.file.originalname);
  if (!result.success) {
    return new Problem(result.errorType, {detail: result.errorMsg}).send(res);
  } else {
    res.setHeader('X-Template-Hash', result.hash);
    return res.send(result.hash);
  }
});

router.post('/template/render', validation.validateTemplate, async (req, res) => {
  console.log('Template upload and render');

  let template = {};
  try {
    template = {...req.body.template};
    if (!template || !template.content) throw Error('Template content not provided.');
    if (!template.fileType) throw Error('Template file type not provided.');
    if (!template.encodingType) throw Error('Template encoding type not provided.');
  } catch (e) {
    return new Problem(400, {detail: e.message}).send(res);
  }

  // let the caller determine if they want to overwrite the template
  //
  const options = req.body.options || {};
  // write to disk...
  const content = await fileCache.write(template.content, template.fileType, template.encodingType, {overwrite: truthy('overwrite', options)});
  if (!content.success) {
    return new Problem(content.errorType, {detail: content.errorMsg}).send(res);
  }

  return await findAndRender(content.hash, req, res);
});

router.post('/template/:uid/render', validation.validateCarbone, async (req, res) => {
  const hash = req.params.uid;
  console.log(`Template render ${hash}.`);
  return await findAndRender(hash, req, res);
});

router.get('/template/:uid', async (req, res) => {
  const hash = req.params.uid;
  const download = req.query.download !== undefined;
  const hashHeaderName = 'X-Template-Hash';
  console.log(`Get Template ${hash}. Download = ${download}`);
  return await getFromCache(hash, hashHeaderName, download, false, res);
});

router.delete('/template/:uid', async (req, res) => {
  const hash = req.params.uid;
  const download = req.query.download !== undefined;
  const hashHeaderName = 'X-Template-Hash';
  console.log(`Delete template: ${hash}. Download = ${download}`);
  return await getFromCache(hash, hashHeaderName, download, true, res);
});

router.get('/render/:uid', async (req, res) => {
  const hash = req.params.uid;
  const download = truthy('download', req.query);
  const hashHeaderName = 'X-Report-Hash';
  console.log(`Get Rendered report ${hash}. Download = ${download}`);
  return await getFromCache(hash, hashHeaderName, download, false, res);
});

router.delete('/render/:uid', async (req, res) => {
  const hash = req.params.uid;
  const download = truthy('download', req.query);
  const hashHeaderName = 'X-Report-Hash';
  console.log(`Delete rendered report: ${hash}. Download = ${download}`);
  return await getFromCache(hash, hashHeaderName, download, true, res);
});

router.get('/fileTypes', async (req, res) => {
  console.log('Get fileTypes');
  if (carboneRenderer.fileTypes instanceof Object) {
    res.status(200).json({
      dictionary: carboneRenderer.fileTypes
    });
  } else {
    return new Problem(500, {detail: 'Unable to get file types dictionary'}).send(res);
  }
});

router.get('/health', (_req, res) => {
  res.sendStatus(200);
});

router.get('/docs', (_req, res) => {
  const docs = require('./docs/docs');
  res.send(docs.getDocHTML(mountPath, 'v1'));
});

router.get('/api-spec.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, './docs/v1.api-spec.yaml'));
});

router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      {name: '/api-spec.yaml', operations: ['GET']},
      {name: '/docs', operations: ['GET']},
      {name: '/fileTypes', operations: ['GET']},
      {name: '/health', operations: ['GET']},
      {name: '/render/{id}', operations: ['GET', 'DELETE']},
      {name: '/template', operations: ['POST']},
      {name: '/template/render', operations: ['POST']},
      {name: '/template/{id}', operations: ['GET', 'DELETE']},
      {name: '/template/{id}/render', operations: ['POST']}
    ]
  });
});


let initialized = false;
module.exports = {

  init(options) {

    let _options = DEFAULT_OPTIONS;
    if (options) {
      _options = {..._options, ...options};
    }

    fileCache = new FileCache({fileCachePath: _options.fileUploadsDir});
    fileUpload.init();

    if (truthy('startCarbone', _options)) {
      carboneRenderer.startFactory(_options.converterFactoryTimeout);
    }
    initialized = true;
  },

  routes(options) {
    if (!initialized) {
      this.init(options);
    }
    return router;
  },

  mount(app, path, options) {
    if (!initialized) {
      this.init(options);
    }

    // expressPath starts with a / ends without /
    // mountPath ends with /
    let expressPath = path || '/';
    if (isString(expressPath)) {
      if (!expressPath.startsWith('/')) {
        expressPath = '/' + expressPath;
      }
      if (expressPath.length > 1) {
        if (expressPath.endsWith('/')) {
          mountPath = expressPath;
          expressPath = expressPath.slice(0, -1);
        } else {
          mountPath = expressPath + '/';
        }
      } else {
        mountPath = expressPath;
      }
    } else {
      throw Error('Could not mount  copy-api, path parameter is not a string.');
    }

    try {
      app.use(expressPath, router);
    } catch (e) {
      if (e && e.stack) {
        console.log(e.stack);
      }
      throw Error(`Could not mount carbone-copy-api to express app at ${path}`);
    }
  }
};
