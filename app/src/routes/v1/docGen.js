const docGenRouter = require('express').Router();
const Problem = require('api-problem');
const {
  body,
  validationResult
} = require('express-validator');

const docGenComponent = require('../../components/docGen');

/** Document generation endpoint */
docGenRouter.post('/', [
  body('fileName').isString()
], async (req, res, next) => {
  // Validate for Bad Requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return new Problem(400, {
      detail: 'Validation failed',
      errors: errors.array()
    }).send(res);
  }

  try {
    const result = await docGenComponent.generateDocument(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = docGenRouter;
