const healthRouter = require('express').Router();

/** Returns the status of correspondent APIs */
healthRouter.get('/', (_req, res) => {
  res.sendStatus(200);
});

module.exports = healthRouter;
