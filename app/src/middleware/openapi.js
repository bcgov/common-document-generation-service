const { dump } = require('js-yaml');

const { getDocHTML, getSpec } = require('../docs');

module.exports = {
  /** OpenAPI Docs */
  getDocs: (version) => (_req, res) => {
    res.send(getDocHTML(version));
  },

  /** OpenAPI JSON Spec */
  getJsonSpec: (version) => (_req, res) => {
    res.status(200).json(getSpec(version));
  },

  /** OpenAPI YAML Spec */
  getYamlSpec: (version) => (_req, res) => {
    res.status(200).type('application/yaml').send(dump(getSpec(version)));
  }
};
