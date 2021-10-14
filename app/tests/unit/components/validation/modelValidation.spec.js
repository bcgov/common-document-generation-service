const { customValidators } = require('../../../../src/components/validation');

// TODO: Refactor this to point to modelValidation contents
describe.skip('customValidators.docGen', () => {
  let body;

  beforeEach(() => {
    body = {
      contexts: [{
        x: 1,
        y: 2
      }],
      template: {
        content: 'ZHNmc2Rmc2RmZHNmc2Rmc2Rmc2Rm',
        contentEncodingType: 'base64',
        contentFileType: 'docx',
        outputFileType: 'pdf',
        outputFileName: 'abc_123_{d.firstname}-{d.lastname}',
      }
    };
  });

  it('should return an empty error array when valid', async () => {
    const result = await customValidators.docGen(body);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error with validation error when invalid', async () => {
    body.contexts = 'garbage';

    const result = await customValidators.docGen(body);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].value).toMatch('garbage');
    expect(result[0].message).toMatch('Invalid value `contexts`.');
  });

  it('should return an empty error array when valid (using the minimum required request fields)', async () => {
    const simpleBody = {
      contexts: [{
        x: 1
      }],
      template: {
        content: 'ZHNmc2Rmc2RmZHNmc2Rmc2Rmc2Rm',
        contentFileType: 'docx',
      }
    };
    const result = await customValidators.docGen(simpleBody);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  it('should return an error array when file type conversion is not supported', async () => {
    body = {
      contexts: [{
        x: 1,
        y: 2
      }],
      template: {
        content: 'ZHNmc2Rmc2RmZHNmc2Rmc2Rmc2Rm',
        contentEncodingType: 'base64',
        contentFileType: 'DOCX',
        outputFileType: 'ppt',
      }
    };
    const result = await customValidators.docGen(body);

    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
    expect(result[0].message).toMatch('Unsupported file type conversion');
  });
});
