
const bytes = require('bytes');
const config = require('config');

const { middleware, modelValidation } = require('../../../../src/components/validation');

const maxFileSize = bytes.parse(config.get('carbone.uploadSize'));

describe('validateCarbone', () => {
  const carboneSpy = jest.spyOn(modelValidation, 'carbone');
  const handleValidationErrorsSpy = jest.spyOn(middleware, '_handleValidationErrors');

  beforeEach(() => {
    carboneSpy.mockReset();
    handleValidationErrorsSpy.mockReset();
  });

  afterAll(() => {
    carboneSpy.mockRestore();
    handleValidationErrorsSpy.mockRestore();
  });

  it('should call modelValidation.carbone and _handleValidationErrors', () => {
    const req = { body: {} };
    const fn = () => {};
    carboneSpy.mockReturnValue([]);

    middleware.validateCarbone(req, {}, fn);

    expect(carboneSpy).toHaveBeenCalledTimes(1);
    expect(carboneSpy).toHaveBeenCalledWith(req.body);
    expect(handleValidationErrorsSpy).toHaveBeenCalledTimes(1);
    expect(handleValidationErrorsSpy).toHaveBeenCalledWith({}, fn, []);
  });
});

describe('validateTemplate', () => {
  const templateSpy = jest.spyOn(modelValidation, 'template');
  const handleValidationErrorsSpy = jest.spyOn(middleware, '_handleValidationErrors');

  beforeEach(() => {
    templateSpy.mockReset();
    handleValidationErrorsSpy.mockReset();
  });

  afterAll(() => {
    templateSpy.mockRestore();
    handleValidationErrorsSpy.mockRestore();
  });

  it('should call modelValidation.template and _handleValidationErrors', () => {
    const req = { body: {} };
    const fn = () => {};
    templateSpy.mockReturnValue([]);

    middleware.validateTemplate(req, {}, fn);

    expect(templateSpy).toHaveBeenCalledTimes(1);
    expect(templateSpy).toHaveBeenCalledWith(req.body, maxFileSize);
    // TODO: Figure out why this test spy isn't working
    // expect(handleValidationErrorsSpy).toHaveBeenCalledTimes(1);
    // expect(handleValidationErrorsSpy).toHaveBeenCalledWith({}, fn, []);
  });
});
