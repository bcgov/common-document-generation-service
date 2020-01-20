const fileTypesRouter = require('express').Router();
const fileTypesComponent = require('../../components/fileTypes');

/** Returns the dictionary of input/output file types */
fileTypesRouter.get('/', async (_req, res, next) => {
  
  const fileTypes = await fileTypesComponent.getFileTypes();

  if (fileTypes instanceof Array) {
    res.status(200).json({
      dictionary: fileTypes
    });
  } else {
    next(new Error('Unable to get file types dictionary'));
  }
});

module.exports = fileTypesRouter;
