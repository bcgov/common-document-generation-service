const carbone = require('carbone');
const config = require('config');
const fs = require('fs-extra');
const path = require('path');

const log = require('./log')(module.filename);
const utils = require('./utils');
const { processTemplateOptions } = require('../routes/shared/templateHelpers');

// Initialize carbone formatters and add a marker to indicate defaults...
// Carbone is a singleton and we cannot set formatters for each render call
const DEFAULT_CARBONE_FORMATTERS = Object.freeze(
  Object.assign({}, carbone.formatters),
);

function addFormatters(formatters) {
  if (Object.keys(formatters).length) {
    carbone.formatters = Object.assign({}, DEFAULT_CARBONE_FORMATTERS);
    carbone.addFormatters(formatters);
    return true;
  }
  return false;
}

function resetFormatters(reset) {
  if (reset) {
    carbone.formatters = Object.assign({}, DEFAULT_CARBONE_FORMATTERS);
  }
}

async function asyncRender(template, data, options) {
  return new Promise((resolve, reject) => {
    carbone.render(template, data, options, (err, result, reportName) => {
      if (err) {
        reject(err);
      } else {
        resolve({ report: result, reportName: reportName });
      }
    });
  });
}

async function render(template, data = {}, options = {}, formatters = {}) {
  const result = {
    success: false,
    errorType: null,
    errorMsg: null,
    reportName: null,
    report: null,
  };

  if (!template) {
    result.errorType = 400;
    result.errorMsg = 'Template not specified.';
    return result;
  }
  if (!fs.existsSync(template)) {
    result.errorType = 404;
    result.errorMsg = 'Template not found.';
    return result;
  }

  // some defaults if options not set...
  const normalizedOptions = processTemplateOptions(
    options,
    path.extname(template).slice(1),
    true,
  );

  const reset = addFormatters(formatters);
  try {
    const renderResult = await asyncRender(template, data, normalizedOptions);
    result.report = renderResult.report;
    result.reportName = renderResult.reportName;
    result.success = true;
  } catch (e) {
    result.errorType = utils.determineCarboneErrorCode(e);
    result.errorMsg = `Could not render template. ${e}`;
    log.warn('Could not render template', { function: 'render', error: e });
  }
  resetFormatters(reset);
  return result;
}

function carboneSet() {
  const options = {};
  if (config.has('carbone.startCarbone')) {
    options.startFactory = true;
    log.info('Carbone LibreOffice worker initialized', {
      function: 'carboneSet',
    });
  }
  if (config.has('carbone.converterFactoryTimeout')) {
    options.converterFactoryTimeout = config.get(
      'carbone.converterFactoryTimeout',
    );
    log.info(
      `Carbone converterFactoryTimeout: ${config.get('carbone.converterFactoryTimeout')}`,
      { function: 'carboneSet' },
    );
  }

  carbone.set(options);
}

module.exports = {
  carboneSet,
  render,
  engine: carbone,
  addFormatters,
  resetFormatters,
};
