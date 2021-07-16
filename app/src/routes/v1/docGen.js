const Problem = require('api-problem');
const docGenRouter = require('express').Router();

/** Document generation endpoint */
docGenRouter.post('/', async (_req, res, next) => {
  next(new Problem(410, { detail: 'Deprecated API. Please migrate to the v2 API.' }).send(res));
});

module.exports = docGenRouter;
