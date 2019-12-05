const config = require('config');
const log = require('npmlog');

const utils = require('../../../src/components/utils');

log.level = config.get('server.logLevel');

describe('prettyStringify', () => {
  const obj = {
    foo: 'bar'
  };

  it('should return a formatted json string with 2 space indent', () => {
    const result = utils.prettyStringify(obj);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n  "foo": "bar"\n}');
  });

  it('should return a formatted json string with 4 space indent', () => {
    const result = utils.prettyStringify(obj, 4);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n    "foo": "bar"\n}');
  });
});

describe('getFileExtension', () => {
  it('should return a the file extension when there is one', () => {
    expect(utils.getFileExtension('abc_123.docx')).toEqual('docx');
    expect(utils.getFileExtension('my file name here.docx')).toEqual('docx');
    expect(utils.getFileExtension('file.name.with.dots.docx')).toEqual('docx');
    expect(utils.getFileExtension('mx_permit_{d.permitNumber}.docx')).toEqual('docx');
  });

  it('should return undefined if no extension', () => {
    expect(utils.getFileExtension('abc_123')).toEqual(undefined);
    expect(utils.getFileExtension('')).toEqual(undefined);
    expect(utils.getFileExtension('   ')).toEqual(undefined);
    expect(utils.getFileExtension(null)).toEqual(undefined);
    expect(utils.getFileExtension(undefined)).toEqual(undefined);
  });
});

