const docGenRouter = require('express').Router();
const { validateDocGen } = require('../../middleware/validation');
const docGenComponent = require('../../components/docGen');

/** Document generation endpoint */
docGenRouter.post('/', validateDocGen, async (req, res, next) => {
  try {
    await docGenComponent.generateDocument(req.body, res);
  } catch (error) {
    next(error);
  }
});

module.exports = docGenRouter;
