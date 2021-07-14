
const Problem = require('api-problem');

const fileTypesRouter = require('express').Router();
const FILE_TYPES = require('../../components/carboneRender').fileTypes;

/** Returns the dictionary of input/output file types */
fileTypesRouter.get('/fileTypes', (_req, res, next) => {
  if (FILE_TYPES instanceof Object) {
    res.status(200).json({ dictionary: FILE_TYPES });
  } else {
    next(new Problem(500, { detail: 'Unable to get file types dictionary' }));
  }
});

module.exports = fileTypesRouter;
