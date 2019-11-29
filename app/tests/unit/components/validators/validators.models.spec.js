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
    const value = [{ firstName: 'x', lastName: 'y' }, { firstName: 'a', lastName: 'b' }];
    const result = models.docGen.contexts(value);
    expect(result).toBeTruthy();
  });

  it('should return true for a empty contexts object', () => {
    const value = [{ }];
    const result = models.docGen.contexts(value);
    expect(result).toBeTruthy();

    const value2 = [{ }];
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
    const value = {a:1, b:2};
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

  it('should return true for a valid template object', () => {
    const value = [{ content: 'x', encoding: 'y' }];
    const result = models.docGen.contexts(value);
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


describe('models.template', () => {

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

