const checksRouter = require('express').Router();

const checkComponent = require('../../components/checks');

/** Returns the status of correspondent APIs */
checksRouter.get('/status', async (_req, res, next) => {
  const statuses = await checkComponent.getStatus();

  if (statuses instanceof Array) {
    res.status(200).json({
      endpoints: statuses
    });
  } else {
    next(new Error('Unable to get API status list'));
  }
});

module.exports = checksRouter;
