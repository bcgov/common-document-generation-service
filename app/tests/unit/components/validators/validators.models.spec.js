const helper = require('../../../common/helper');

const { models } = require('../../../../src/components/validators');
const { smallFile } = require('../../../fixtures/base64Files');

helper.logHelper();

describe('models.docGen.contexts', () => {

  it('should return true for a valid contexts object (single)', () => {
    const value = [{ firstName: 'x', lastName: 'y' }];
    const result = models.docGen.contexts(value);
    expect(result).toBeTruthy();
  });

  it('should return true for a valid contexts object (multiple)', () => {
    const value = [
      { firstName: 'x', lastName: 'y' },
      { firstName: 'a', lastName: 'b' }
    ];
    const result = models.docGen.contexts(value);
    expect(result).toBeTruthy();
  });

  it('should return true for a empty contexts object', () => {
    const value = [{}];
    const result = models.docGen.contexts(value);
    expect(result).toBeTruthy();

    const value2 = [{}];
    const result2 = models.docGen.contexts(value2);
    expect(result2).toBeTruthy();
  });

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.docGen.contexts(value);
    expect(result).toBeFalsy();
  });

  it('should return false for a string', () => {
    const value = 'test';
    const result = models.docGen.contexts(value);
    expect(result).toBeFalsy();
  });

  it('should return false for an object', () => {
    const value = { a: 1, b: 2 };
    const result = models.docGen.contexts(value);
    expect(result).toBeFalsy();
  });

  it('should return false for an empty array', () => {
    const value = [];
    const result = models.docGen.contexts(value);
    expect(result).toBeFalsy();
  });
});

describe('models.docGen.template', () => {
  it('should return true for a valid simple template object', () => {
    const value = { content: 'x', contentFileType: 'docx' };
    const result = models.docGen.template(value);
    expect(result).toBeTruthy();
  });

  it('should return true for a template object', () => {
    const value = {
      content: 'x',
      contentEncodingType: 'y',
      contentFileType: 'docx',
      outputFileType: 'pdf',
      outputFileName: '{d.firstname}-{d.lastname}'
    };
    const result = models.docGen.template(value);
    expect(result).toBeTruthy();
  });

  it('should return false for undefined', () => {
    const value = undefined;
    const result = models.docGen.template(value);
    expect(result).toBeFalsy();
  });

  it('should return false for a string', () => {
    const value = 'test';
    const result = models.docGen.template(value);
    expect(result).toBeFalsy();
  });
});


describe('models.template.contentFileType', () => {

  it('should return false for blank contentFileType', async () => {
    const contentFileType = '';
    const result = await models.template.contentFileType(contentFileType);
    expect(result).toBeFalsy();
  });

  it('should return false for null contentFileType', async () => {
    const contentFileType = null;
    const result = await models.template.contentFileType(contentFileType);
    expect(result).toBeFalsy();
  });

  it('should return false for undefined contentFileType', async () => {
    const contentFileType = undefined;
    const result = await models.template.contentFileType(contentFileType);
    expect(result).toBeFalsy();
  });

  it('should return false for non-string contentFileType', async () => {
    const contentFileType = [1, 2];
    const result = await models.template.contentFileType(contentFileType);
    expect(result).toBeFalsy();
  });

  it('should return true for valid contentFileType', async () => {
    const contentFileType = 'docx';
    const result = await models.template.contentFileType(contentFileType);
    expect(result).toBeTruthy();
  });

});

describe('models.template.outputFileType', () => {

  it('should return true for valid outputFileType', async () => {
    const outputFileType = 'pdf';
    const result = await models.template.outputFileType(outputFileType);
    expect(result).toBeTruthy();
  });

  it('should return false for non-string outputFileType', async () => {
    const outputFileType = { an: 'object' };
    const result = await models.template.outputFileType(outputFileType);
    expect(result).toBeFalsy();
  });

});

describe('models.template.outputFileName', () => {

  it('should return true for valid outputFileName', async () => {
    const outputFileName = 'abc_123_{d.test}';
    const result = await models.template.outputFileName(outputFileName);
    expect(result).toBeTruthy();
  });
  it('should return false for non-string outputFileName', async () => {
    const outputFileName = ['an', 'array'];
    const result = await models.template.outputFileName(outputFileName);
    expect(result).toBeFalsy();
  });

});

describe('models.template.content', () => {

  it('should return true for valid content', async () => {
    const content = smallFile.content;
    const result = await models.template.content(content);
    expect(result).toBeTruthy();
  });

  it('should return false for invalid content', async () => {
    const content = null;
    const result = await models.template.content(content);
    expect(result).toBeFalsy();
  });

  it('should return true for file size equal to limit', async () => {
    const content = smallFile.content;
    const result = await models.template.size(content, 'base64', smallFile.size);
    expect(result).toBeTruthy();
  });

  it('should return true for file smaller than limit', async () => {
    const content = smallFile.content;
    const result = await models.template.size(content, 'base64', smallFile.size + 1);
    expect(result).toBeTruthy();
  });

  it('should return false for file larger than limit', async () => {
    const content = smallFile.content;
    const result = await models.template.size(content, 'base64', smallFile.size - 1);
    expect(result).toBeFalsy();
  });

  it('should return false for no content', async () => {
    const content = '';
    const result = await models.template.size(content, 'base64', smallFile.size);
    expect(result).toBeFalsy();
  });

  it('should return false for invalid encoding', async () => {
    const content = smallFile.content;
    const result = await models.template.size(content, 'base64xxx', smallFile.size);
    expect(result).toBeFalsy();
  });

  it('should return true for bytes parseable limit', async () => {
    const content = smallFile.content;
    const result = await models.template.size(content, 'base64', '1mb');
    expect(result).toBeTruthy();
  });

  it('should return false for invalid limit', async () => {
    const content = smallFile.content;
    const result = await models.template.size(content, 'base64', 'bad limit cannot parse');
    expect(result).toBeFalsy();
  });

  it('should return false for limit less than 1 byte', async () => {
    const content = smallFile.content;
    const result = await models.template.size(content, 'base64', 0);
    expect(result).toBeFalsy();
  });

  it('should return false on temp file handling error', async () => {
    const tmp = require('tmp');
    const spy = jest.spyOn(tmp, 'fileSync');
    spy.mockImplementation(() => {
      throw new Error('coverage');
    });

    const content = smallFile.content;
    const result = await models.template.size(content, 'base64');
    expect(result).toBeFalsy();

    spy.mockRestore();
  });

});

describe('models.template.contentEncodingType', () => {

  it('should return true for valid contentEncodingType', async () => {
    const contentEncodingType = 'base64';
    const result = await models.template.contentEncodingType(contentEncodingType);
    expect(result).toBeTruthy();
  });

  it('should return true for no contentEncodingType', async () => {
    const contentEncodingType = undefined;
    const result = await models.template.contentEncodingType(contentEncodingType);
    expect(result).toBeTruthy();
  });

  it('should return false for invalid contentEncodingType', async () => {
    const contentEncodingType = 'xxx';
    const result = await models.template.contentEncodingType(contentEncodingType);
    expect(result).toBeFalsy();
  });

});

describe('models.template.fileConversion', () => {

  it('should return true for valid fileConversion', async () => {
    const inputFileType = 'docx';
    const outputFileType = 'pdf';
    const result = await models.template.fileConversion(inputFileType, outputFileType);
    expect(result).toBeTruthy();
  });

});
