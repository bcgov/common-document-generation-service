
const Problem = require('api-problem');

const fileTypesRouter = require('express').Router();
const { fileTypes } = require('../../components/carboneRender');

/** Returns the dictionary of input/output file types */
fileTypesRouter.get('/fileTypes', (_req, res, next) => {
  if (fileTypes instanceof Object) {
    res.status(200).json({ dictionary: fileTypes });
  } else {
    next(new Problem(500, { detail: 'Unable to get file types dictionary' }));
  }
});

module.exports = fileTypesRouter;
