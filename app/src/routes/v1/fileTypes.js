const Problem = require('api-problem');
const fileTypesRouter = require('express').Router();

/** Returns the dictionary of input/output file types */
fileTypesRouter.get('/', (_req, res, next) => {
  next(new Problem(410, { detail: 'Deprecated API. Please migrate to the v2 API.' }).send(res));
});

module.exports = fileTypesRouter;
