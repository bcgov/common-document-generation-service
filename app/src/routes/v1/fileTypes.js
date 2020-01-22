const fileTypesRouter = require('express').Router();
const fileTypesObject = require('../../assets/fileTypes.json');

/** Returns the dictionary of input/output file types */
fileTypesRouter.get('/', async (_req, res, next) => {

  if (fileTypesObject instanceof Object) {
    res.status(200).json({
      dictionary: fileTypesObject
    });
  } else {
    next(new Error('Unable to get file types dictionary'));
  }
});

module.exports = fileTypesRouter;
