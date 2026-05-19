const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const log = require('./log')(module.filename);
const utils = require('./utils');
const { addFormatters, resetFormatters } = require('./carboneRender');

/**
 * Wraps callback-based carbone API (V2) into a promise
 */
async function renderCallback(
  carboneEngine,
  template,
  data,
  options,
  formatters = {},
) {
  return new Promise((resolve, reject) => {
    const reset = addFormatters(carboneEngine, formatters);

    carboneEngine.render(template, data, options, (err, result, reportName) => {
      resetFormatters(carboneEngine, reset);
      if (err) {
        reject(err);
      } else {
        resolve({ report: result, reportName, filename: reportName });
      }
    });
  });
}

/**
 * Wraps promise-based carbone-sdk API (V3) - pass through
 */
async function renderPromise(carboneEngine, template, data, options) {
  return carboneEngine.renderPromise(template, {
    data,
    ...options,
  });
}

/**
 * Unified render function that works with either carbone engine
 * @param {object} carboneEngine - carbone engine instance (v2 carbone or v3 carbone-sdk)
 * @param {string} template - path to template file
 * @param {object} data - data to render with template
 * @param {object} options - carbone render options
 * @param {boolean} isPromiseBased - whether engine uses promises (v3) or callbacks (v2)
 * @param {object} formatters - optional custom formatters to add for the render
 * @returns {Promise<object>} - result object with success, report, reportName, errorType, errorMsg
 */
async function render(
  carboneEngine,
  template,
  data = {},
  options = {},
  isPromiseBased = false,
  formatters = {},
) {
  const result = {
    success: false,
    errorType: null,
    errorMsg: null,
    reportName: null,
    report: null,
  };

  if (!carboneEngine) {
    result.errorType = 500;
    result.errorMsg = 'Carbone engine not initialized.';
    return result;
  }

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

  // Set defaults if options not set...
  if (!options.convertTo || !options.convertTo.trim().length) {
    // set convert to template type (no conversion)
    options.convertTo = path.extname(template).slice(1);
  }
  if (!options.reportName || !options.reportName.trim().length) {
    // no report name, set to UUID
    options.reportName = `${uuidv4()}.${options.convertTo}`;
  }

  // ensure the reportName has the same extension as the convertTo
  if (options.convertTo !== path.extname(options.reportName).slice(1)) {
    options.reportName = `${path.parse(options.reportName).name}.${options.convertTo}`;
  }

  try {
    let renderResult;

    // use appropriate render method based on engine type
    if (isPromiseBased) {
      renderResult = await renderPromise(
        carboneEngine,
        template,
        data,
        options,
      );
    } else {
      renderResult = await renderCallback(
        carboneEngine,
        template,
        data,
        options,
        formatters,
      );
    }

    result.report = renderResult.report || renderResult.content;
    result.reportName = renderResult.reportName || renderResult.filename;
    result.success = true;

    log.info('Template rendered successfully', {
      function: 'render',
      reportName: result.reportName,
    });
  } catch (e) {
    result.errorType = utils.determineCarboneErrorCode(e);
    result.errorMsg = `Could not render template. ${e}`;
    log.warn('Could not render template', { function: 'render', error: e });
  }

  return result;
}

module.exports = {
  render,
};
