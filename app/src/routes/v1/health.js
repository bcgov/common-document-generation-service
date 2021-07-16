const Problem = require('api-problem');
const healthRouter = require('express').Router();

/** Returns the status of correspondent APIs */
healthRouter.get('/', async (_req, res, next) => {
  next(new Problem(410, { detail: 'Deprecated API. Please migrate to the v2 API.' }).send(res));
});

module.exports = healthRouter;
